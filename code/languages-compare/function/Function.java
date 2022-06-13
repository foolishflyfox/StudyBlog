public class Function {
    public static void main(String[] args) {
        hello("fff");
        Function function = new Function();
        function.bar();
    }
    public static void hello(String name) {
        System.out.println("hello, " + name);
    }
    public void bar() {
        System.out.println("call bar");
    }
}
