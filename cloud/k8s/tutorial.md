# Kubernetes 安装

以 CentOS 环境为例。
参考：https://blog.csdn.net/mryang125/article/details/108429951

## CentOS 配置

- CentOS 配置 IP 地址: 修改文件 */etc/sysconfig/network-scripts/ifcfg-ens33* ，可能网卡名会有所不同。

## 工具介绍

- [iterm2](https://iterm2.com/) : 可以同时对多个终端进行输入
    - 启动同时输入: ⌘ + ⇧ + i

## 安装

### 前置安装

- Cent OS 版本在 7.5 以上。

- 主机名解析，为了方便后续集群节点间的直接调用，配置如下的主机名(修改 */etc/hosts*)：
```
192.168.155.100 master
192.168.155.101 node1
192.168.155.102 node2
```
**注意，这种解析方式是在测试环境中使用，如果是生产环境，建议使用 DNS 服务器。**

- 时间同步 Kubernetes 要求集群中的时间必须精确一致，可以直接从 chronyd 服务从网络同步时间。**企业中推荐配置内部的时间同步服务器**。
```shell
# 设置时区
$ timedatectl set-timezone Asia/Shanghai
# 启动 chronyd 服务
$ systemctl start chronyd
# 设置 chronyd 服务开机自启动
$ systemctl enable chronyd
# 查看时间
$ date
```

- 禁用 iptables 和 firewalld 服务。Kubernetes 和 docker 在运行中会产生大量的 iptables 规则，为了不让系统规则跟它们混淆，直接关闭系统的规则。**注意，这里仅仅在测试环境中，在生产环境中防火墙的关闭要慎重。**
```shell
$ systemctl stop firewalld
$ systemctl disable firewalld
# 有的 centos 没有 iptables
$ systemctl stop iptables
$ systemctl disable iptables
```

- 禁用 selinux: selinux 是 Linux 系统下的一个安全服务，如果不关闭它，在安装集群中会产生各种奇葩的问题。通过 `getenforce` 命令可以查看当前 selinux 的状态。
```
# 编辑 /etc/selinux/config 文件，修改 SELINUX 的值为 disable
# 修改之后重启 linux 服务
SELINUX=disabled
```

- 禁用 swap 分区: swap 分区指的是虚拟内存分区，它的作用是在物理内存使用完后，将磁盘空间虚拟成内存来使用。启用 swap 设备会对系统的性能产生非常负面的影响，因此 kubernetes 要求每个节点都要禁用 swap 设备。但是如果因为某些原因确实不能关闭 swap 分区，就需要在集群安装过程中通过明确的参数进行配置说明。通过 `free -m` 查看是否禁用成功。
```
# 编辑分区配置文件 /etc/fstab ，注释掉 swap 分区一行
# 注意修改完毕后重启 linux
# UUID=14fc40c0-1731-4673-a54b-de39a0726105 swap    swap    defaults        0 0
```

- 修改 linux 的内核参数
```shell
# 修改 linux 的内核参数，添加我敲过滤和地址转发功能
# 编辑 /etc/sysctl.d/kubernetes.conf 文件，添加如下配置:
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip_forward = 1

# 重新加载配置
$ sysctl -p
# 加载网桥过滤模块
$ modprobe br-netfilter
# 查看网桥过滤模块是否加载成功，能查出来即可
$ lsmod | grep br_netfilter
```

- 配置 ipvs 功能
在 kubernetes 中 service 有两种代理模型，一种是基于 iptables 的，一种是基于 ipvs 的。两者比较的话，ipvs 的性能明显要高一些，如果要使用它，需要手动载入 ipvs 模块
```shell
# 1. 安装 ipset 和 ipvsadm
$ yum install ipset ipvsadm -y
# 2. 添加需要加载的模块写入脚本文件
$ cat <<EOF > /etc/sysconfig/modules/ipvs.modules
#!/bin/bash
modprobe -- ip_vs
modprobe -- ip_vs_rr
modprobe -- ip_vs_wrr
modprobe -- ip_vs_sh
modprobe -- nf_conntrack_ipv4
EOF
# 3. 为脚本文件添加执行权限
$ chmod +x /etc/sysconfig/modules/ipvs.modules
# 4. 执行脚本
$ /bin/bash /etc/sysconfig/modules/ipvs.modules
# 5. 查看对应的模块是否加载成功
$ lsmod | grep -e ip_vs -e nf_conntrack_ipv4
```

- 重启服务器

## 安装 Kubernetes 环境

### 安装 docker

可先参考下面安装 Kubernetes 更换 CentOS 源。
```shell
# 1. 切换镜像源
$ wget https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo -O /etc/yum.repos.d/docker-ce.repo

# 2. 查看当前镜像源中支持的 docker 版本 (安装版本选择 docker-ce.x86_64 18.06.3.ce-3.el7，很多参数已经做了初始化)
$ yum list docker-ce --showduplicates
# 3. 安装特定版本的 docker-ce
# 必须指定 --setopt=obsoletes=0，否则 yum 会自动安装更高版本
$ yum install --setopt=obsoletes=0 docker-ce-18.06.3.ce-3.el7 -y
# 4. 添加一个配置文件
# Docker 在默认情况下使用的 Cgroup Driver 为 cgroupfs，而 kubernetes 推荐使用 systemd 来替代 cgroupfs
$ mkdir /etc/docker
$ cat <<EOF > /etc/docker/daemon.json
{
    "exec-opts": ["native.cgroupdriver=systemd"],
    "registry-mirrors": ["https://kn0t2bca.mirror.aliyuncs.com"]
}
EOF
# 5. 启动 docker
$ systemctl restart docker
$ systemctl enable docker
# 6. 检查 docker 版本
$ docker --version
```
### 安装 Kubernetes 准备组件

- CentOS 换清华源，参考 [CentOS 镜像使用帮助](https://mirrors.tuna.tsinghua.edu.cn/help/centos/)
```
$ sed -e 's|^mirrorlist=|#mirrorlist=|g' \
         -e 's|^#baseurl=http://mirror.centos.org|baseurl=https://mirrors.tuna.tsinghua.edu.cn|g' \
         -i.bak \
         /etc/yum.repos.d/CentOS-Base.repo
$ yum makecache
```

- 设置 kubernetes 源
```shell
# 编辑 /etc/yum.repos.d/kubernetes.repo 添加下面的配置
[kubernetes]
name=Kubernetes
baseurl=http://mirrors.tuna.tsinghua.edu.cn/kubernetes/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=0
repo_gpgcheck=0
gpgkey=http://mirrors.tuna.tsinghua.edu.cn/kubernetes/yum/doc/yum-key.gpg
       http://mirrors.tuna.tsinghua.edu.cn/kubernetes/yum/doc/rpm-package-key.gpg
```


- 安装 kubeadm、kubelet 和 kubectl 
```shell
$ yum install --setopt=obsoletes=0 kubelet-1.17.4-0 -y
$ kubelet --version
Kubernetes v1.17.4


$ yum install --setopt=obsoletes=0 kubectl-1.17.4-0 -y
$ kubectl version
Client Version: version.Info{Major:"1", Minor:"17", GitVersion:"v1.17.4", GitCommit:"8d8aa39598534325ad77120c120a22b3a990b5ea", GitTreeState:"clean", BuildDate:"2020-03-12T21:03:42Z", GoVersion:"go1.13.8", Compiler:"gc", Platform:"linux/amd64"}
The connection to the server localhost:8080 was refused - did you specify the right host or port?


# kubeadm 必须最后安装
$ yum install --setopt=obsoletes=0 kubeadm-1.17.4-0 -y
$ kubeadm version
kubeadm version: &version.Info{Major:"1", Minor:"17", GitVersion:"v1.17.4", GitCommit:"8d8aa39598534325ad77120c120a22b3a990b5ea", GitTreeState:"clean", BuildDate:"2020-03-12T21:01:11Z", GoVersion:"go1.13.8", Compiler:"gc", Platform:"linux/amd64"}
```

- 配置 kubelet 的 cgroup
```shell
# 编辑 /etc/sysconfig/kubelet，添加下面的配置 
KUBELET_EXTRA_ARGS="--cgroup-driver=systemd"
KUBE_PROXY_MODE="ipvs"
```

- 配置 kubelet 开机自启动
```
$ systemctl enable kubelet
```

### 集群安装

#### 镜像拉取

```
# 在安装 kubernetes 集群之前，必须要提前准备好需要的镜像，所需镜像就可以通过下面的命令查看
$ kubeadm config images list
I0710 15:15:37.239870    8159 version.go:251] remote version is much newer: v1.24.2; falling back to: stable-1.17
W0710 15:15:38.618518    8159 validation.go:28] Cannot validate kube-proxy config - no validator is available
W0710 15:15:38.618533    8159 validation.go:28] Cannot validate kubelet config - no validator is available
k8s.gcr.io/kube-apiserver:v1.17.17
k8s.gcr.io/kube-controller-manager:v1.17.17
k8s.gcr.io/kube-scheduler:v1.17.17
k8s.gcr.io/kube-proxy:v1.17.17
k8s.gcr.io/pause:3.1
k8s.gcr.io/etcd:3.4.3-0
k8s.gcr.io/coredns:1.6.5
# 下载镜像
$ images=(
    kube-apiserver:v1.17.4
    kube-controller-manager:v1.17.4
    kube-scheduler:v1.17.4
    kube-proxy:v1.17.4
    pause:3.1
    etcd:3.4.3-0
    coredns:1.6.5
)
```

创建如下脚本 prepare.sh：
```shell
images=(
    kube-apiserver:v1.17.4
    kube-controller-manager:v1.17.4
    kube-scheduler:v1.17.4
    kube-proxy:v1.17.4
    pause:3.1
    etcd:3.4.3-0
    coredns:1.6.5
)
for imageName in ${images[@]} ; do
    echo $imageName
    # 从阿里云仓库中获取镜像
    docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/$imageName
    # 将名字换成官方的镜像
    docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/$imageName k8s.gcr.io/$imageName
    docker rmi registry.cn-hangzhou.aliyuncs.com/google_containers/$imageName
done
```

#### 集群初始化

下面开始对集群进行初始化，并将 node 节点加入到集群中。下面的操作只需要在 master 节点上执行即可(即执行了这些命令的即为 master 节点)。

```shell
# 创建集群
$ kubeadm init --kubernetes-version=v1.17.4 --pod-network-cidr=10.244.0.0/16 --service-cidr=10.96.0.0/12 --apiserver-advertise-address=192.168.155.100
```
出现 
```
Your Kubernetes control-plane has initialized successfully!

To start using your cluster, you need to run the following as a regular user:

  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config

You should now deploy a pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
  https://kubernetes.io/docs/concepts/cluster-administration/addons/

Then you can join any number of worker nodes by running the following on each as root:

告诉用户 node 节点如何加入集群
kubeadm join 192.168.155.100:6443 --token fvjzr6.7r27xkmhtki8aknx \
    --discovery-token-ca-cert-hash sha256:1f2605981b0cdcb44acddb892d811d2dfc684ae5a5f90fa1aa9fa83025660324 
```
表示集群初始化成功。

在 master 几点上继续执行如下命令：
```shell
# 创建必要的文件
$ mkdir -p $HOME/.kube
$ cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
$ chown $(id -u):$(id -g) $HOME/.kube/config
```

将 node 节点加入集群，在 node 节点上执行：
```
$ kubeadm join 192.168.155.100:6443 --token fvjzr6.7r27xkmhtki8aknx \
    --discovery-token-ca-cert-hash sha256:1f2605981b0cdcb44acddb892d811d2dfc684ae5a5f90fa1aa9fa83025660324 
```

kubernetes 支持多种网络插件，比如 flannel、calico、canal 等等，任选一种使用即可，本次选择 flannel。
安装网络插件，在 master 节点上执行。
```shell
# 获取 fannel 的配置文件
$ wget https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
# [可省略]修改文件中 quay.io 仓库为 quay-mirror.qiniu.com
```

使用配置文件启动 fannel: 
```
$ kubectl apply -f kube-flannel.yml 
podsecuritypolicy.policy/psp.flannel.unprivileged created
clusterrole.rbac.authorization.k8s.io/flannel created
clusterrolebinding.rbac.authorization.k8s.io/flannel created
serviceaccount/flannel created
configmap/kube-flannel-cfg created
daemonset.apps/kube-flannel-ds created
```

稍等片刻，再次查看集群节点的状态：
```shell
$ kubectl get nodes
NAME     STATUS   ROLES    AGE   VERSION
master   Ready    master   66m   v1.17.4
node1    Ready    <none>   57m   v1.17.4
node2    Ready    <none>   56m   v1.17.4
```

## 环境测试

接下来在 kubenetes 集群中部署一个 nginx 程序，测试集群是否正常工作。
```shell
# 部署 nginx，在 master 节点上执行
$ kubectl create deployment nginx --image=nginx:1.14-alpine
deployment.apps/nginx created

# 暴露端口
$ kubectl expose deployment nginx --port=80 --type=NodePort
service/nginx exposed

# 查看 pod，pod 是 k8s 的最小单元，程序在容器中，容器在 pod 中
$ kubectl get pod
NAME                    READY   STATUS             RESTARTS   AGE
nginx-66b8b78dc-nmk7n   0/1     Running            0          3m18s
# 查看服务状态
$ kubectl get service
NAME         TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)        AGE
kubernetes   ClusterIP   10.96.0.1     <none>        443/TCP        75m
nginx        NodePort    10.105.55.1   <none>        80:31929/TCP   3m20s
```

## 资源管理

### 资源管理介绍

在 Kubenetes 中，所有的内容都被抽象为资源。用户需要通过操作资源来管理 Kubenetes。

> Kubenetes 本质上是一个集群系统，用户可以在集群中部署各种服务，所谓的部署服务，其实就是在 kubernetes 集群中运行一个个的容器，并将指定的程序跑在容器中。
> Kubenetes 的最小管理单元是 pod 而不是容器，所以只能将容器放在 Pod 中，而 Kubernetes 一般也不会直接接管 Pod，而是通过 Pod 控制器来管理 Pod 的。
> Pod 可以提供服务之后，就要考虑如何访问 Pod 中的访问，Kubernetes 提供了 Service 资源实现这个功能。如果 Pod 中程序的数据需要持久化，Kubernetes 还提供了各种存储系统。


### 资源管理语法 YAML

YAML 是一个类似于 XML、JSON 的标记性语言。它强调以数据为中心，并不是以标识语言为重点。因而 YAML 的定义比较简单，号称是一种人性化的数据格式语言。

对比学习：[YAML vs. JSON](https://json2yaml.com/convert-yaml-to-json) 。

#### YAML 的语法

YAML 的语法比较简单，主要有下面几个：
- 大小写敏感
- 使用缩进表示层级关系
- 缩进不允许使用 tab，只允许使用空格(对低版本的限制)
- 缩进的空格数不重要，只要相同层级的元素左对齐即可
- '#' 表示注释

#### YAML 的数据类型

YAML 支持以下数据类型：
- 纯量：单个的值，如字符串、布尔值、数值、null(~)、日期(2022-07-11)
- 对象
- 数组

### 资源管理方式

- 命令式对象管理：直接使用命令去操作 kubernetes 资源 `kubectl run nginx-pod --image=nginx:1.17.1 --port=80`
- 命令式对象配置：通过命令配置和配置文件去操作 kubenetes 资源 `kubectl create/patch -f nginx-pod.yaml`
- 声明式对象配置：通过 apply 命令和配置文件去操作 kubenetes 资源 `kubectl apply -f nginx-pod.yaml`

|类型|操作对象|使用环境|优点|缺点|
|---|---|---|---|---|
|命令式对象管理|对象|测试|简单|只能操作活动对象，无法审计、跟踪|
|命令式对象配置|文件|开发|可以审计、跟踪|项目大时，配置文件多，操作麻烦|
|声明式对象配置|目录|开发|支持目录操作|意外情况下难以调试|

#### 命令式对象管理

kubectl 是 kubenetes 的集群命令行根据，通过它可以对集群本身进行管理，并能够在集群上进行容器化应用的安装部署。kubectl 命令语法如下：
```shell
kubectl [command] [type] [name] [flags]
```
- command: 指定要对资源执行的操作，例如 create、get、delete
- type: 指定资源类型，例如 deployment、pod、service
- name: 指定资源的名称，名称大小写敏感
- flags: 指定额外的可选参数

例如：
```
# 查看所有pod
$ kubectl get pod

# 查看详细信息
$ kubectl get pod -o wide
$ kubectl get pod -o json
$ kubectl get pod -o yaml
```

kubectl 常用命令：

|命令分类|命令|含义|作用|
|---|---|---|---|
|基本命令|create|创建|创建一个资源|
||edit|编辑|编辑一个资源|
||get|查询|获取一个资源|
||patch|更新|更新一个资源|
||delete|删除|删除一个资源|
||explain|解释|展示资源文档|
|运行和调试|run|运行|在集群中运行一个指定的镜像|
||expose|暴露|暴露资源为 Service|
||describe|描述|显示资源内部信息|
||logs|日志|输出容器在 pod 中的日志|
||attach|接触|进入运行中的容器|
||exec|执行|执行容器中的一个命令|
||cp|复制|在 pod 内外复制文件|
||rollout|首次展示|管理资源的发布|
||scale|缩放|扩(缩)容 pod 的数量|
||autoscale|自动调整|自动调整 pod 的数量|
|高级命令|apply|rc|通过文件对资源进行配置|
||label|标签|更新资源上的标签|
|其他命令|cluster-info|集群信息|显示集群信息|
||version|版本|显示当前server和client的版本|

kubernetes 的常用资源：
|资源分类|资源名称|缩写|作用|
|---|---|---|---|
|集群级别资源|nodes|no|集群组成部分|
||namespace|ns|隔离 pod|
|pod 资源|pods|po|装载容器|
|pod 资源控制器|replicationcontrollers|rc|控制 pod 资源|
||replicasets|rs|控制pod资源|
||deployments|deploy|控制pod资源|
||jobs||控制pod资源|
||cronjobs|cj|控制pod资源|
||horizontalpodautoscalers|hpa|控制pod资源|
||statefulsets|sts|控制pod资源|
|服务发现资源|services|svc|统一pod对外接口|
||ingress|ing|统一pod对外接口|
|存储资源|volumeattachments||存储|
||persistentvolumes|pv|存储|
||persistentvolumeclaims|pvc|存储|
|配置资源|configmaps|cm|配置|
||secrets||配置|

### 实践

#### 命令式 kubectl 资源管理

```shell
# 查看当前命名空间
$ kubectl get namespace
NAME              STATUS   AGE
default           Active   3h23m
kube-node-lease   Active   3h23m
kube-public       Active   3h23m
kube-system       Active   3h23m

# 创建一个 namespace
$ kubectl create namespace dev

# 查看指定的 namespace
$ kubectl get namespace dev
NAME   STATUS   AGE
dev    Active   15s

# 在 dev 下创建并运行一个 nginx 的 Pod
$ kubectl run pod --image=nginx -n dev
kubectl run --generator=deployment/apps.v1 is DEPRECATED and will be removed in a future version. Use kubectl run --generator=run-pod/v1 or kubectl create instead.
deployment.apps/pod created

# 查看新创建的 Pod
$ kubectl get pod -n dev
```

#### 命令式对象配置

创建一个 nginxpod.yaml，内容如下：
```yaml
# 创建 namespace
apiVersion: v1
kind: Namespace
metadata:
    name: dev

---

# 创建 pod
apiVersion: v1
kind: Pod
metadata:
    name: nginxpod
    namespace: dev
spec:
    containers:
    - name: nginx-containers
      image: nginx
```

执行：`kubectl create -f nginxpod.yaml`

#### 声明式对象配置

`kubectl apply -f nginxpod.yaml` 。其实声明式对象配置就是使用 apply 描述一个资源最终的状态（在 yaml 中定义的状态），使用 apply 操作资源，如果资源不存在，则创建，相当于 `kubectl create`，如果资源存在，则更新，相当于 `kubectl patch`。

### 总结

推荐方案：
- 创建/更新资源：使用声明式对象配置 `kubectl apply -f xxx.yaml`
- 删除资源：使用命令式对象配置 `kubectl delete -f xxx.yaml`
- 查询资源：使用命令式对象管理 `kubectl describe 资源名称`

## 实战入门

介绍如何在 kubenetes 集群中部署一个 nginx 服务，并且能够对其进行访问。

### Namespace

Namespace 是 k8s 中一种非常重要的资源，它的主要作用是实现多套环境的资源隔离或多租户的资源隔离。

默认情况下，k8s 中的所有 pod 都是可以相互访问的。但在实际中，可能不想让两个 pod 之间相互访问，那此时就可以将两个 Pod 划分到不同的 namespace 中，k8s 通过将集群内部的资源分配到不同的 namespace 中，可以形成逻辑上的 “组”，以便于不同的组的资源进行隔离使用和管理。

可以通过 k8s 的授权机制，将不同的 namespace 交给不同租户进行管理，这样就实现了多租户的资源隔离。此时还能介乎 k8s 的资源配额机制，限定不同租户能占用的资源，例如 CPU 使用量、内存使用量等等，来实现租户可用资源的管理。

k8s 在集群启动后，会默认创建几个 namespace。

```shell
$ kubectl get ns
NAME              STATUS   AGE
default           Active   5h7m  # 所有未指定 Namespace 的对象都会被分配在 default 命名空间
kube-node-lease   Active   5h7m  # 集群节点之间的心跳维护，v1.13开始引入
kube-public       Active   5h7m  # 此命名空间下的资源可以被所有人访问(包括未认证用户)
kube-system       Active   5h7m  # 所有由 k8s 系统创建的资源都放在这个命名空间, STATUS 可以是 Terminating
```

#### namespace 的命令

- 查询
    - `kubectl get ns [命名空间名]`
    - `kubectl describe ns [命名空间名]`
- 创建
    - `kubectl create ns [命名空间名]`
- 删除
    - `kubectl delete ns [命名空间名]`

配置方式：准备一个 *ns-dev.yaml* :
```yaml
apiVersion: v1
kind: Namespace
metadata:
    name: dev
```
- 创建：`kubectl create -f ns-dev.yaml`
- 删除：`kubectl delete -f ns-dev.yaml`

### Pod

Pod 是 k8s 集群管理的最小单元。程序要运行必须部署在容器中，而容器必须存在于 Pod 中。Pod 可以认为是容器的封装，一个 Pod 中可以存在一个或多个容器。

#### 创建并运行 pod

kubenetes 没有提供单独运行 Pod 的命令，都是通过 pod 控制器来实现的。
```shell
# 命令格式: kubectl run (pod控制器名称) [参数]
# --image 指定 Pod 的镜像
# --port 指定端口号
# --namespace 指定namespace
$ kubectl run nginx --image=nginx --port=80 --namespace dev
```

#### 查看 pod 信息

```shell
# 查看 pod 基本信息
$ kubectl get pods -n dev
NAME                     READY   STATUS    RESTARTS   AGE
nginx-5578584966-v49cw   1/1     Running   0          92s

# 查看 Pod 的详细信息
$ kubectl get pod nginx-5578584966-v49cw -n dev -o wide
NAME                     READY   STATUS    RESTARTS   AGE   IP            NODE    NOMINATED NODE   READINESS GATES
nginx-5578584966-v49cw   1/1     Running   0          10m   10.244.1.10   node1   <none>           <none>

# 查看更加详细的信息
$ kubectl describe pod nginx-5578584966-v49cw -n dev

# pod 的删除
$ kubectl delete pod 
```

配置操作，创建一个 *pod-nginx.yaml* ，内容如下：
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
  namespace: dev
spec:
  containers:
  - image: nginx
    imagePullPolicy: IfNotPresent
    name: pod
    ports:
    - name: nginx-port
      containerPort: 80
      protocol: TCP
```


### Label

Label 是 kubernetes 系统中的一个重要概念，它的作用就是在资源上添加标识，用来对它们进行区分和选择。Label 的特点：

- 一个 Label 会以 key/value 键值对的形式附加到各种对象上，如 Node、Pod、Service 等等。
- 一个资源对象可以定义在任意数量的 Label，同一个 Label 也可以被添加到任意数量的资源对象上去。
- Label 通常在资源对象定义时确定，当然也可以在对象创建后动态添加或删除。

可以通过 Label 实现资源的多维度分组，以便于灵活的进行资源分配、调度、配置、部署等管理工作。

Label Selector：选择标签。
- 基于等式的 Label Selector，例如 `name = slave`
- 基于集合的 Label Selector，例如 `name in {master, slave}`

标签选择条件可以使用多个，此时将多个 Label Selector 进行组合，使用逗号进行分隔，例如 `name=slave,env!=production`，`name not in (frontend), env!=production`。

命令方式：
```shell
# 为 pod 资源打标签
$ kubectl label pod nginx-pod version=1.0 -n dev
# 为 pod 资源更新标签
$ kubectl label pod nginx-pod version=2.0 -n dev --overwrite
# 查看 Label
$ kubectl get pod nginx-pod -n dev --show-labels
# 筛选标签
$ kubectl get pods -l "version!=2.0" -n dev --show-labels
# 删除标签
$ kubectl label pod nginx-pod -n dev tier-
```

- 配置方式
```shell
apiVersion: v1
kind: Pod
metadata:
  name: nginx3
  namespace: dev
  labels:
    version: "3.0"
    env: "test"
spec:
  containers:
  - image: nginx
    imagePullPolicy: IfNotPresent
    name: pod
    ports:
    - name: nginx-port
      containerPort: 80
      protocol: TCP
```

### Deployment

在 k8s 中，Pod 是最小的控制单元，但是 k8s 很少直接控制 Pod，一般都是通过 Pod 控制器来完成的。
Pod 控制器用于 pod 的管理，确保 pod 资源符合预期的状态，当 pod 的资源出现故障时，会尝试进行重启或重建pod。
Deployment 是 Pod 控制器的一种。

#### 创建一个

```shell
$ kubectl run nginx --image=nginx --port=80 --replicas=3 -n dev
```

#### 查看 pod 控制器

```shell
$ kubectl get deployment -n dev
```

#### 删除控制器

```shell
$ kubectl delete deployment nginx-1 -n dev
```

#### 配置操作
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
  namespace: dev
spec:
  replicas: 3
  selector:
    matchLabels:
      run: nginx
  template:
    metadata:
      labels:
        run: nginx
    spec:
      containers:
      - image: nginx
        name: nginx
        ports:
        - containerPort: 80
          protocol: TCP
```


### Service

Service 可以看作是一组同类 Pod 对外访问的接口。借助 Service，应用可以方便地实现服务发现和负载均衡。

#### 创建集群内部可访问的 service

```shell
# 暴露内部
$ kubectl expose deployment nginx --name=svc-nginx1 --type=ClusterIP --port=80 --target-port=80 -n dev

# 暴露到外部
$ kubectl expose deployment nginx --name=svc-nginx2 --type=NodePort --port=80 --target-port=80 -n dev
```
配置方式：
```yaml
apiVersion: v1
kind: Service
metadata:
  name: svc-nginx
  namespace: dev
spec:
  clusterIP: 10.109.179.231
  ports:
  - port: 80
    protocol: TCP
    targetPort: 80
  selector:
    run: nginx
  type: ClusterIP
```

## Pod 详解

### Pod 介绍

#### Pod 结构

每个 Pod 中都可以包含一个或多个容器，这些容器可以分为两类。
- 用户程序所在的容器，数量可多可少
- Pause 容器，这是每个 Pod 都会有的一个**根容器**，它的作用有两个：
    - 可以以它为依据，评估整个 Pod 的健康状态
    - 可以在根容器上设置 ip 地址，其他容器都以此 IP，实现 Pod 内部的网络通信。Pod 之间的通信采用虚拟二层网络技术来实现，我们当前环境使用的是 Flannel

### 基本配置

创建 pod-base.yaml，内容如下：
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-base
  namespace: dev
  labels:
    user: heima
spec:
  containers:
  - name: nginx
    image: nginx:1.17.1
  - name: busybox
    image: busybox:1.30
```
配置镜像拉取策略，k8s 支持配置3种拉取策略：
- Always：总是从远程仓库拉取镜像
- IfNotPresent：如果本地有，则使用本地镜像，本地没有则远程下载
- Never：只使用本地镜像，从不去远程拉取，本地没有则保存

创建 pod-imagepullpolicy.yaml:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-imagepullpolicy
  namespace: dev
spec:
  containers:
  - name: nginx
    image: nginx:1.17.2
    imagePullPolicy: Never
```
pod.spec.containers 的 command 指定启动命令，args 指定启动参数。
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-command
  namespace: dev
spec:
  containers:
  - name: nginx
    image: nginx:1.17.1
  - name: busybox
    image: busybox:1.30
    command: ["/bin/bash", "-c", "touch /tmp/hello.txt; while true; do /bin/echo $(date +%T) >> /tmp/hello.txt; sleep 3; done;"]
```

创建 pod-env.yaml 文件：
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-env
  namespace: dev
spec:
  containers:
  - name: busybox
    image: busybox:1.30
    command: ["/bin/sh", "-c", "while true;do /bin/echo $(date +%T); sleep 60; done;"]
    env: # 设置环境变量
    - name: "username"
      value: "admin"
    - name: "password"
      value: "123456"
```

创建 pod-ports.yaml
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-ports
  namespace: dev
spec:
  containers:
  - name: nginx
    image: nginx:1.17.1
    ports:
    - name: nginx-port
      containerPort: 80
      protocol: TCP
```

### 资源配额

通过 resources 选项可以实现资源限额，它有两个子选项：
- limits: 用于限制运行时容器的最大占用资源，当容器占用资源超过 limits 时会被终止，并进行重启
- requests: 用于限制容器需要的最小资源，如果环境资源不够，容器无法启动

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-resources
  namespace: dev
spec:
  containers:
  - name: nginx
    image: nginx:1.17.1
    resources:  # 资源配额
      limits:  # 资源上限
        cpu: "2"
        memory: "10Gi"
      requests:  # 资源下限
        cpu: "1"
        memory: "10Mi"
```

### Pod 的生命周期

- pod 创建过程
- 运行初始化容器(init container)过程
- 运行主容器(main container)过程
    - 容器启动后钩子(post start)，容器终止前钩子(pre stop)
    - 容器的存活性探测(liveness probe),就绪性探测(readiness probe)

在整个生命周期中，Pod 会出现5种状态(相位)：
- 挂起(Pending): apiserver 已经创建了 pod 资源对象，但它尚未被调度或者仍然处于下载镜像的过程中
- 运行中(Running): pod 已经被调度到某节点，并且所有容器都已经被 kubelet 创建完成
- 成功(Succeeded): pod 中的所有容器都已经成功终止并且不会被重启
- 失败(Failed): 所有的容器都已经终止，但至少有一个容器终止失败，即容器返回了非0值的退出状态
- 未知(Unknown): apiserver 无法正常获取到 pod 对象的状态信息，通常由于网络通信失败导致

#### Pod 的创建与终止

- 初始化容器
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-initcontainer
  namespace: dev
spec:
  containers:
  - name: nginx
    image: nginx:1.17.1
    ports:
    - name: nginx-port
      containerPort: 80
  initContainers:
  - name: test-mysql
    image: busybox:1.30
    command: ['sh', '-c', 'until ping 192.168.155.1 -c 1; do echo waiting for mysql ...; sleep 2; done;']
```

- 钩子函数：k8s 在主容器启动之后和停止之前提供了两个钩子函数
    - post start：容器创建之后执行，如果失败了会重启容器
    - pre stop：容器终止之前执行，执行完成之后容器将成功终止，在其完成之前会阻塞删除容器的操作

钩子处理器支持下面3种方式定义动作：
- Exec 命令：在容器内执行一次命令
```yaml
--
  lifecycle:
    postStart:
      exec:
        command:
        - cat
        - /tmp/healthy
--
```
- TCPSocket: 在当前容器尝试访问指定的 Socket
```yaml
--
  lifecycle:
    postStart:
      tcpSocket:
        port: 8080
--
```
- HTTPGet: 在当前容器中向某 url 发起 http 请求
```yaml
--
  lifecycle:
    postStart:
      httpGet:
        path: /
        port: 80
        host: 192.168.155.100
        scheme: HTTP
```

钩子函数案例：
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-hook-exec
  namespace: dev
spec:
  containers:
    - name: main-container
      image: nginx:1.17.1
      ports:
      - name: nginx-port
        containerPort: 80
      lifecycle:
        postStart:
          exec:  # 在容器启动时执行一个命令，修改掉 nginx 的默认首页内容
            command: ["/bin/sh", "-c", "echo postStart... > /usr/share/nginx/html/index.html"]
        preStop:
          exec:  # 在容器停止之前停止 nginx 服务
            command: ["/usr/sbin/nginx", "-s", "quit"]
```

## DashBoard 的安装与部署

- 下载 yaml 
```shell
$ wget https://raw.githubusercontent.com/kubernetes/dashboard/v2.0.0/aio/deploy/recommended.yaml
```
- 修改 kubernetes-dashboard 的 Service 类型
```yaml
kind: Service
apiVersion: v1
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard
  namespace: kubernetes-dashboard
spec:
  type: NodePort  # 新增
  ports:
    - port: 443
      targetPort: 8443
      nodePort: 30009  # 新增
  selector:
    k8s-app: kubernetes-dashboard
```

- 查看安装情况
```shell
$ kubectl get pod,svc -n kubernetes-dashboard
NAME                                            READY   STATUS    RESTARTS   AGE
pod/dashboard-metrics-scraper-c79c65bb7-zz86f   1/1     Running   0          56s
pod/kubernetes-dashboard-56484d4c5-hglfs        1/1     Running   0          59s

NAME                                TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)         AGE
service/dashboard-metrics-scraper   ClusterIP   10.103.232.252   <none>        8000/TCP        60s
service/kubernetes-dashboard        NodePort    10.111.170.52    <none>        443:30009/TCP   71s
```
访问：https://192.168.155.100:30009 (通过 FireFox)

- 创建访问账户，获取 token
```shell
# 创建账号
$ kubectl create serviceaccount dashboard-admin -n kubernetes-dashboard

# 授权
$ kubectl create clusterrolebinding dashboard-admin-rb --clusterrole=cluster-admin --serviceaccount=kubernetes-dashboard:dashboard-admin

# 获取账号 token
$ kubectl get secrets -n  kubernetes-dashboard | grep dashboard-admin
dashboard-admin-token-mnzwh        kubernetes.io/service-account-token   3      2m35s

$ kubectl describe secrets dashboard-admin-token-mnzwh -n kubernetes-dashboard
Name:         dashboard-admin-token-mnzwh
Namespace:    kubernetes-dashboard
Labels:       <none>
Annotations:  kubernetes.io/service-account.name: dashboard-admin
              kubernetes.io/service-account.uid: 2b6fe82c-f775-40b4-b591-9f8b814551c3

Type:  kubernetes.io/service-account-token

Data
====
ca.crt:     1025 bytes
namespace:  20 bytes
token:      eyJhbGciOiJSUzI1NiIsImtpZCI6Im9MblpyX21DNmFGaGJ0a1Iyd1Y4cDZkNE1tVEhoS2cwbGw0d0RjUkYwSncifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJrdWJlcm5ldGVzLWRhc2hib2FyZCIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VjcmV0Lm5hbWUiOiJkYXNoYm9hcmQtYWRtaW4tdG9rZW4tbW56d2giLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC5uYW1lIjoiZGFzaGJvYXJkLWFkbWluIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQudWlkIjoiMmI2ZmU4MmMtZjc3NS00MGI0LWI1OTEtOWY4YjgxNDU1MWMzIiwic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50Omt1YmVybmV0ZXMtZGFzaGJvYXJkOmRhc2hib2FyZC1hZG1pbiJ9.LT8PfFJ1lJyXYzSe6L3-7qbnwUOF-VFe5oqb38lNLwQHavXFjsFVwb9vrN5BuP5jDmppvy4g1oEdtwCsB1_rr3uDsknobhvwzkfIh264l9kmi6XSj2f7bJVRROgEX_hwZ0pHq39JV3NnTG09n7EHToLhvQ8-9lz0_058AjigE3BN4kf-QrUTdxpi-W3Oyu1EZGJJrIIz8X5S3C3--4GIXJIcWgDezWx7AkLsyzajgHeHOnnoDc3hed64NAsJzNNCs6wqoPMs-B34ba4Vh5LZOL3QjvrXSohslvv0rfd3lbCwsmlPQPd0-rAEEf2ilAZA1kK97rST8fAVUwx1y8JtGw
```

## Service

在 k8s 中，pod 是应用程序的载体，我们可以通过 pod 的 ip 来访问应用程序。但是 pod 的 ip 地址不是固定的，这也就意味着不方便直接采用 pod 的 ip 对服务进行访问。

## Ingress


## 问题与解决

### 1. namespace 不能删除

1. 将namespace内容导出到tmp.json文件中
```
$ kubectl get namespace NAMESPACE_NAME -o json > tmp.json
```
2. 修改tmp.json内容，删除json中以下内容
```json
{
    //删除spec整个内容
    "spec": {
        "finalizers": [
            "kubernetes"
        ]
    },
    
    "status": {
        "phase": "Terminating"
    }
}
```
3. 开启 k8s 接口代理，新开一个窗口，执行：
```shell
$ kubectl proxy
Starting to serve on 127.0.0.1:8001
```
4. 调用接口删除 Namespace
```shell
$ curl -k -H "Content-Type: application/json" -X PUT --data-binary @tmp.json http://127.0.0.1:8001/api/v1/namespaces/NAMESPACE_NAME/finalize
```
