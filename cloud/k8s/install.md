# Kubernetes 安装

以 CentOS 环境为例。

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
$ yum install ipset ipvsadmin -y
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
$ yum install --setopt=obsoletes=0 kubeadm-1.17.4-0 -y
# 经过测试，上面的命令安装完了之后，下面两天不需要在执行也完成了安装
# 如果不放心，可以再执行一遍
# $ yum install --setopt=obsoletes=0 kubelet-1.17.4-0 -y
# $ yum install --setopt=obsoletes=0 kubectl-1.17.4-0 -y
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
创建如下脚本：
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
done
```


下面开始对集群进行初始化，并将 node 节点加入到集群中。下面的操作只需要在 master 节点上执行即可。

