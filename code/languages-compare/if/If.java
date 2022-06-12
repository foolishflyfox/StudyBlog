
public class If {
    public static void main(String[] args) {
        int a = 10;
        // 演示 if
        if (a % 2 == 0) {
            System.out.println("a is times of 2");
        }
        // 演示 if-else
        if (a  < 0) {
            System.out.println("a < 0");
        } else if (a < 5) {
            System.out.println("a >= 0 && a < 5");
        } else {
            System.out.println("a >= 5");
        }
    }
}

