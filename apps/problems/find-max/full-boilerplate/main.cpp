#include <bits/stdc++.h>
using namespace std;

## USER CODE

int main() {
    freopen("input.txt", "r", stdin);

    int size_arr;
    cin >> size_arr;
    vector<int> arr(size_arr);
    for (int i = 0; i < size_arr; i++) {
      cin >> arr[i];
    }

    Solution sol;
    int result = sol.findMax(arr);
    cout << result << endl;
}
