import java.util.*;

## USER CODE

public class Main {
  public static void main(String[] args) {
    Scanner scanner = new Scanner(System.in);

    int size_arr = scanner.nextInt();
    int[] arr = new int[size_arr];
    for (int i = 0; i < size_arr; i++) {
        arr[i] = scanner.nextInt();
    }

    int result = Solution.findMax(arr);
    System.out.println(result);

    scanner.close();
  }
}
