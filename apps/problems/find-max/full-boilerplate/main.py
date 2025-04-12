from typing import List

## USER CODE

if __name__ == "__main__":
    solution = Solution()

    size_arr = int(input())
    arr = list(map(int, input().split()))

    result = solution.findMax(arr)
    print(result)
