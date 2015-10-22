binary_search = [ array target lower upper comparator |
    mid = _div (lower + upper + 1) 2
    ret if (lower >= upper) [
        ret lower
    ] else [
        ret if (comparator mid) [
            ret binary_search array target lower (mid - 1) comparator
        ] else [
            ret binary_search array target mid upper comparator
        ]
    ]
]

find_mountain_index_of = [ array target |
    peak = binary_search array Infinity 0 (array.length - 1) [ index |
        ret (index > 0 and array@(index - 1) > array@index)
    ]

    left = binary_search array target 0 peak [ index |
        ret (target < array@index)
    ]
    right = binary_search array target peak (array.length - 1) [ index |
        ret (target > array@index)
    ]

    ret if (array@left == target) [
        ret left
    ] else [
        ret if (array@right == target) [
            ret right
        ] else [
            ret -1
        ]
    ]
]

arr = {
    1
    3
    5
    7
    9
    8
    6
    4
    2
}

mutable i = 0
while [ret (i < arr.length)] [
    console.log "testing" i arr@i
    index = find_mountain_index_of arr (arr @ i)
    if (index != i) [
        console.error ("index " + i + " returned " + index)
    ]
    mutate i = i + 1
]

