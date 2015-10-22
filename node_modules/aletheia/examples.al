x = 5
if x == 1 [
    
] x == 2 [

] else [

]


mutable i = 5;
while [
    x = regex.match str;
    x != null
] [
    console.log i;
    kvector.add(
        coord,
        dist_vec
    );

    kvector.add
        coord
        dist_vec;
    
    [it.coord!]

    ret (
        kvector.add
        coord
        dist_vec
    )

    mutate i = i - 1;
]

for my_list [e |
    console.log e
]










for = [list lambda |
    mutable i = 0
    mutable result = <>
    while [ret i != list.length] [
        result.push (lambda list@i i)
        mutate i = i + 1
    ]
    ret result
];


for = [list lambda |
    mutable i = 0;
    mutable result = <>;
    while [ret i != list.length] [
        result.push (lambda list@i i);
        mutate i = i + 1;
    ];
    result
];









obj = {
    key | "value"
    key: value
    key = value
}

for = [list lambda |
    mutable i = 0
    mutable result = <>
    r = (ReactComponent {
                prop: 5
            }
        (Child1 ())
    )
    while [ret i != list.length] [
        result.push (lambda list@i i)
        mutate i = i + 1
    ]
    ret result
]

for = {list lambda |
    mutable i = 0
    mutable result = []
    while {ret i != list.length} {
        result.push (lambda list@i i)
        mutate i = i + 1
    }
    ret result
}

mapwhile = [cond body |
    mutable result = ()
    while cond [
        result.push body!
    ]
    ret result
];

all_matches = [regex str |
    mutable match = null
    ret mapwhile [
        mutate match = regex.exec str
        ret match != null
    ] [
        ret match
    ]
];

if x == 5 [
    return 6
]


#####
try {
    __if(x == 5, function() {

    })
} catch (e) {
    if (e instanceof __return) {
        if (e.value instanceof __return) {
            throw e.value
        } else {
            return e.value;
        }
    }
}
#####

var __result = __if(x == 5, function() {

});
if (__result instanceof __return) {
    return 
}


myarray.sort [ _.coord () ]

myarray:_.map [ _.coord() ]

f = [a b | my_function foo a b]
f = my_function:_.partial foo

#let x = (-> c (+ 3) (/ 2) (- 1))
let x = (-> c (add 3) (div 2) (sub 1))

x = c:add 3:div 2:sub 1



return _.map(this.props.answerForms, form => formExamples[form](this.props));

ret this.props.answerForms -> _.map [formExamples[it](this.props)]
ret this.props.answerForms:_.map [formExamples[it](this.props)] : 

[p.coord ()]
p\coord


########

#coords = [it.coord() for it in my_list]
 coords = map my_list [ it.coord () ]
 coords = my_list -> _.map [it.coord ()]
 coords = [it.coord ()] -> [map my_list it]


switch (node.match ()) [ case |
    case 1 2 var var [a b | console.log a b ],
    case 1, 2,  [ ]
]

x = if (node == 4) [
    ret 'a'
] (node == 5) [
    ret 'b'
] (node == 6) [
    ret 'c'
]

x = if (node == 4) ['a']
       (node == 5) ['b']
       (node == 6) ['c'];

x = switch node 4 [
    ret 'a'
] 5 [
    ret 'b'
] 6 [
    ret 'c'
]

for = [ list lambda |
    var i = 0
    var result = {}
    while [i != list.length] [
        result.push (lambda list@i i)
    ]
    ret result
];

for = [ list lambda |
    var i = 0;
    var result = {};
    while [i != list.length] [
        result.push (lambda list@i i);
    ];
    result
];


v = kvector.add |
    {1 2}
    {3 4}
|


================================

// arguments are separated by parens, but lambdas can go after/before/between
// parens:

if (a == b) [
    console.log("hi", "bye")
]

this.setState({
    thing: 5,
    that: 6
}) [
    // some callback
    console.log("string")
]


