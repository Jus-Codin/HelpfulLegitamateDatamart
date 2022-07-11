let carat="█"
let prompt;
var currentdir=[]
var timer;
let res;
let responset;
let history=[];
let hist_i = 0;
let filesystem = {
    "aboutme.txt" : "aboutme.html",
    "skills" :                                  {
        "proficient.txt" : "proficient.html",
        "learning.txt" : "learning.html",
        "want_to_learn.txt" : "want_to_learn.html"
    },
    "projects" : {
        "this_website" : "this_website.html"
    }
}

function setEndOfContenteditable(contentEditableElement)
{
    var range,selection;
    if(document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
    {
        range = document.createRange();//Create a range (a range is a like the selection but invisible)
        range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
        range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
        selection = window.getSelection();//get the selection object (allows you to change selection)
        selection.removeAllRanges();//remove any selections already made
        selection.addRange(range);//make the range you have just created the visible selection
    }
    else if(document.selection)//IE 8 and lower
    { 
        range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
        range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
        range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
        range.select();//Select the range (make it the visible selection
    }
}

function autocomplete(){
    var s = document.getElementsByClassName("command")
    var current = s[s.length-1]
    var cd = cwd()
    var cmd = current.innerHTML.replace(/[<]br[^>]*[>]/gi,"").replace(/&nbsp;/g,' ').trim().split(" ");
    if (cmd.length > 0 && ac.includes(cmd[0])){
        var possible = []
        for (var fn in cd) {
            if (fn.includes(cmd[cmd.length-1])){
                possible.push(fn);
            }
        }
        if (possible.length == 1){
            cmd.pop()
            current.innerHTML = cmd.concat(possible).join(" ");
            current.focus();
            setEndOfContenteditable(current)
        }
    }
}

function get_history(i){
    if (i > 0){
        if (hist_i > 0){
            var t = document.getElementsByClassName("command")
            if (hist_i == history.length){
                history.push(t[t.length-1].innerHTML)
            }
            hist_i -= 1
            t[t.length-1].innerHTML = history[hist_i]
            setEndOfContenteditable(t[t.length-1])
        }
    } else if (hist_i < history.length-1){
        var t = document.getElementsByClassName("command")
        hist_i += 1
        t[t.length-1].innerHTML = history[hist_i]
        setEndOfContenteditable(t[t.length-1])
    }
}

function checkaKey(a){
    var t = document.getElementsByClassName('command')
    if (document.activeElement==t[t.length-1]) setEndOfContenteditable(t[t.length-1]);
    
    var e = a || window.event;
    e = e.keyCode;
    if(e == 38) {a.preventDefault();get_history(1);}
    if(e == 40) {a.preventDefault();get_history(-1);}
    if(e == 9){a.preventDefault();autocomplete();}
}

function checkkey(key){
    if(key == 13) invoke_command();
}


function load(){
    document.onkeydown = checkaKey;

    clearInterval(timer)
    let t = document.getElementById("terminal")
    prompt=document.getElementById("prompt").innerHTML;
    timer=setInterval(() => {
        var c=document.getElementById("cursorblink")
        if (c.innerHTML == carat){
            c.innerHTML = ""
        } else {
            c.innerHTML = carat
        }
    }, 800);
    document.getElementsByClassName('command')[document.getElementsByClassName('command').length-1].focus();
}

/* Behind the scenes stuff */
let ac = [];

function invoke_command(){
    var t = document.getElementsByClassName("command")
    t[t.length-1].setAttribute("contenteditable", false);
    let command = t[t.length-1].innerHTML.replace(/[<]br[^>]*[>]/gi,"").replace(/&nbsp;/g,' ').trim();
    var output = (command.length>0) ? "<span style='color:red;'>shell: command not found: ".concat(command.split(' ')[0],"</span>") : ""
    for (const key in commands){
        if (command.split(" ")[0] == key){
            hist_i += 1
            history = history.slice(0, hist_i);
            history.push(command)
            output = commands[key].func(command.substring(key.length+1))
        }
    }

    document.getElementById("history").innerHTML=document.getElementById("history").innerHTML.concat('<br>',output,(output.length>0)? '<br>' :'' , prompt)
    let newprompt = document.getElementsByClassName('command')[document.getElementsByClassName('command').length-1]
    newprompt.focus();
    var dir = document.getElementsByClassName('dir')[document.getElementsByClassName('dir').length-1]
    dir.innerHTML = (currentdir.length>0) ? currentdir[currentdir.length-1]:"root"

}

class Command {
    /**
     * 
     * @param {function} func 
     * @param {String} name 
     * @param {String} help
     * @param {Boolean} autocomplete 
     */
    constructor(func, name, help, autocomplete){
        this.name = name;
        this._func = func;
        this.help = help
        this.autocomplete = autocomplete
        if (this.autocomplete){
            ac.push(this.name)
        }
    }
    get func(){
        return this._func
    }
}



function cwd(){
    var current = filesystem
    for (let i = 0; i < currentdir.length; i++) {
        current = filesystem[currentdir[i]];
    }
    return current
}



var list_dir = new Command(
    function (args){
        var current = cwd()
        var dirs = []
        for (const key in current) {
            if (current[key].constructor == Object) {
                dirs.push('<span style="color:white">'.concat(key,'</span>')) 
            } else {
                dirs.push(key)
            }
        }
        return dirs.join("<br>")
    },
    "ls",
    "List all files in directory",
    false
);

var get_help = new Command(
    function (args){
        var table = "<table><tr><th>Command</th><th>Desc</th></tr>"

        for (const key in commands) {
            table = table.concat(
                "<tr><td>",
                key,
                "</td><td>",
                commands[key].help,
                "</td></tr>"
            )
        }
        return table.concat("</table>")
    },
    "help",
    "Shows this message",
    false
);

function cd(args){
    if (args == "") {
        currentdir = []
        return ""
    }
    args = args.split("/")

    var current = cwd()
    let x = args.shift().replace(/[<]br[^>]*[>]/gi,"");

    if (x == ".." && currentdir.length > 0) {
        currentdir.pop()
    } else if (x in current) {
        if (current[x].constructor == Object){
            currentdir.push(x)
        } else {
            return '<span style="color:red;">cd: not a directory: '.concat(x, "</span>")
        }
    } else {
        return '<span style="color:red;">cd: no such file or directory: '.concat(x, "</span> ")
    }
    if (args.length > 0) {
        return cd(args)
    }
    return ""
}

var chng_dir = new Command(
    cd,
    "cd",
    "Change directory to another folder",
    true
);

var cat = new Command(
    function (args){
        var current = cwd()
        res = "";
        if (current[args] != undefined){
            if (current[args].constructor != Object){
                let dir = currentdir.join("/")
                res = ""
                let path = "".concat("/HelpfulLegitamateDatamart/root/", dir, (dir!="") ? "/" : "", current[args])
                var xhr = new XMLHttpRequest();
                xhr.open("GET", path, false)
                xhr.onload = function (e){
                    if (xhr.readyState === 4){
                        if (xhr.status === 200){
                            responset = xhr.responseText;
                        } else {
                            console.error(xhr.statusText);
                        }
                    }
                };
                xhr.send(null)
                res = responset
                return res
            } else {
                return '<span style="color:red;">cat: not a file: '.concat(args, "</span>")
            }
        } else {
            return '<span style="color:red;">cat: no such file or directory: '.concat(args, "</span>")
        }
    },
    "cat",
    "Outputs content of file. Usage: cat (filename with extension)",
    true
);

var clear = new Command(
    function (args){
        document.getElementById("history").innerHTML = ""
        return ""
    },
    "clear",
    "Clears all text on screen",
    false
);

let commands = {
    "ls" : list_dir,
    "help" : get_help,
    "cd" : chng_dir,
    "cat" : cat,
    "clear" : clear
}
