/* JavaScript Document

Project: Html Quiz to mimic Articulate Quizzes
Author: Mark Duiker (on behalf of Kids Help Phone )
Created: May 2013

Notes: 
- jquery-1.9.1.min.js and jquery.easing.1.3.js are assumed to be available. 
*/


//********************************** VARIABLES **********************************

var qu = {
    width: window.innerWidth,
    height: window.innerHeight,
    type: undefined,
    url: "data/questions", // defaults to "Are you a good friend?" Quiz
    done: false,
    bgAspect: 1.6065 // background aspect ration
};

var quiz = new Array(); // holds all question info (loaded in from an xml document) in an array
var qHtml = ""; // code for quiz pages
// var qlistHtml = ""; // code for question listing
var answered = new Array(); // store info on if a question was answered yet

var currentPage = 1;
var totalPages;

var backgroundImage = "friendship-bg.jpg"; // this is the default background image if one is not defined.
var splashImage = "";

var score = 0;

//********************************** FUNCTIONS **********************************



init_html = function() {
    console.log("init_html");
    fonts_load(); // load google fonts and font awesome after page render

    canvas_resize();

    qu.url = "data/" + getUrlVars()["quiz"] + ".xml"; // grab from url
    xml_loadQuestions(qu.url);
}

fonts_load = function() {
    WebFontConfig = {
        google: {
            families: ['Open+Sans:400,700', 'Amatic SC']
        }
    };

    (function(d) {
        var wf = d.createElement('script'),
            s = d.scripts[0];
        wf.src = 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.16/webfont.js';
        s.parentNode.insertBefore(wf, s);
    })(document);

    // Load icon fonts
    if (document.createStyleSheet) {
        document.createStyleSheet('https://maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css');
    } else {
        var styles = "@import url('https://maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css');";
        var newSS = document.createElement('link');
        newSS.rel = 'stylesheet';
        newSS.href = 'data:text/css,' + escape(styles);
        document.getElementsByTagName("head")[0].appendChild(newSS);
    }
}

init_jquery = function() {

    bg_resize();
    vertical_center();
}

canvas_resize = function() {

    // resize canvas
    qu.height = window.innerHeight;
    qu.width = window.innerWidth;
    qu.aspect = qu.width / qu.height;

    if (qu.aspect >= qu.bgAspect) {
        qu.orientation = "landscape";
        document.getElementById("canvas").class = qu.orientation;
    } else {
        qu.orientation = "portrait";
        document.getElementById("canvas").class = qu.orientation;
    }
    document.getElementById("canvas").style.height = qu.height + "px";

    // document.getElementById("response").style.width = qu.width + "px";

    bg_resize();
    vertical_center();
}

vertical_center = function() {

    var newMT;
    $(".vCenter").each(function() {

        newMT = (($("#canvas").outerHeight() - $(this).outerHeight()) / 2) - 35;
        $(this).css("margin-top", newMT + "px");
    });
}

bg_resize = function() { // resize background image 

    if (qu.orientation == "portrait") {

        $(".bg").height(qu.height);
        var bgWidth = Math.floor(qu.height * qu.bgAspect);

        $(".bg").css({
            "width": bgWidth + "px",
            "margin-top": "",
            "margin-left": ((qu.width - bgWidth) / 2) + "px"
        });

    } else { // landscape

        $(".bg").width(qu.width);
        var bgHeight = Math.floor(qu.width / qu.bgAspect);

        $(".bg").css({
            "margin-left": "",
            "height": bgHeight + "px",
            "margin-top": ((qu.height - bgHeight) / 2) + "px"
        });
    }
}

xml_loadQuestions = function(url) { // load xml

    // get content from questions.xml 
    $.ajax({ /*Asynchronous JavaScript and XML, a function from the jquery function library*/
        type: "GET",
        url: url,
        dataType: "xml",
        success: xml_parseQuestions /* if xml is found then execute this function, it's further down the page */
    });
}

xml_parseQuestions = function(data) { // feed xml into quiz array
    // walk through xml and save info into arrays

    var root = $(data).find("data");

    // save separate types of questions into xml nodes  
    var title = OrphanFilter($(root).find("title").text());
    document.title = $(root).find("title").text() + " | Kids Help Phone"; // set page title
    var description = OrphanFilter($(root).find("description").text());
    var scores = $(root).find("scores").text();
    qu.type = $(root).find("quizType").text();

    if ($(root).find("backgroundImage").text().length > 1) {
        backgroundImage = $(root).find("backgroundImage").text();
    }
    if ($(root).find("titleBackgroundImage").text().length > 1) {
        splashImage = $(root).find("titleBackgroundImage").text();
    }

    quiz = [title, description, scores];

    var questions = $(root).find("questions");

    var tempArr = new Array();
    var ansArr = new Array();

    $(questions).children().each(function() { // loop through each question

        var text = OrphanFilter($(this).find("text").text()); // save question text
        var response = OrphanFilter($(this).find("response").text()); // save response text
        tempArr = [text, response];

        $(this).children().each(function() { // loop through all q children to collect answers          

            if ((this).nodeName == "a") {

                ansArr.push(OrphanFilter($(this).text())); // save answer text
                ansArr.push(Number($(this).attr('value'))); // save answer value            

                tempArr.push(ansArr);
                ansArr = []; // clear ansArr
            }

        });

        quiz.push(tempArr); // save this question
        tempArr = []; // clear tempArr for next question    

    });

    // trigger next step
    build_quiz();
}

build_quiz = function() {

    build_splash();
    build_questions();
    build_scorePage();
    build_ui();
    build_bg(); // add background images

    $('#canvas').html(qHtml); // add quiz code

    addListeners();

    run();
}

build_splash = function() {

    qHtml += "<div class='page' id='splash'>";

    qHtml += "<div class='vCenter'><h1>" + quiz[0] + "</h1>";
    qHtml += "<p>" + quiz[1] + "</p></div>";

    var questionNum = quiz.length - 3;
    qHtml += "<p>(" + txt.questionNumber.replace("{{#}}", questionNum) + ")</p>";

    qHtml += "</div>";
}

build_questions = function() {

    totalPages = quiz.length - 1; // save totalPages

    var len = quiz.length - 3;
    for (var i = 0; i < len; i++) { // loop through questions and build page

        qHtml += "<div class='page'>";
        // qHtml += "<p class='questionNum'>" + txt.question + " " + (i + 1) + "</p>";
        qHtml += "<p class='questionNum'>Q." + (i + 1) + "</p>";
        qHtml += "<h2 class='question'>" + quiz[i + 3][0] + "</h2>";
        // qlistHtml += "<p>" + (i + 1) + ". " + quiz[i + 3][0] + "</p>";
        answered.push(false); // initialize answered array

        var len2 = quiz[i + 3].length - 2;
        for (var j = 0; j < len2; j++) { // loop through question choices           
            qHtml += "<a class='choice button'> " + quiz[i + 3][j + 2][0] + "</a>";
        }
        qHtml += "</div>";

    }
}

build_scorePage = function() {
    qHtml += "<div class='page' id='score'>";
    qHtml += quiz[2];
    qHtml += "</div>";
}

build_ui = function() {

    qHtml += "<div id='footer'>";
    qHtml += "<a id='submitBt' class='button'>" + txt.button.submit + "</a>";
    qHtml += "<a id='nextBt' class='button' >" + txt.button.next + " &nbsp;<i class='fa fa-arrow-right' aria-hidden='true'></i></a>";
    // qHtml += "<a id='reviewBt' class='button' >" + txt.button.review + "</a>";
    qHtml += "<a id='redoBt' class='button' >" + txt.button.restart + "</a>";

    qHtml += "</div>";

    qHtml += "<div id='noClick'></div>"; // insert a button 'nullifier' into the interface

    qHtml += "<div id='response'><div></div>";
    qHtml += "<p><a id='nextQBt' class='button'>" + txt.button.nextQuestion + "</a></p>";
    qHtml += "</div>";

    qHtml += "<div id='header'>";
    qHtml += "<p id='title'>" + quiz[0] + "</p>";
    // qHtml += "<div id='questionList'><div class='listing'></div></div>";
    // qHtml += "<a id='questionListBt' class='button' >Questions <img src='img/icon-expand.gif'></a>";
    qHtml += "<p id='pageNum'>" + String(currentPage) + " / " + totalPages + "</p>";
    qHtml += "</div>";
}

build_bg = function() {

    qHtml += "<img class='bg' src='./img/backgrounds/" + backgroundImage + "'>";
    $("#canvas").css("background", "url(./img/backgrounds/" + backgroundImage + ") center top repeat"); // set tiling background for really wide options
}

function addListeners() {

    $('#nextBt, #nextQBt').click(function() {
        nextPage(currentPage + 1);

        if ($('#response').css('display') == "block") {
            $('#response').fadeOut('fast', 'swing'); // hide response
            $('#noClick').css('display', 'none');
        }
    });
    $('#submitBt').click(function() {
        checkAnswer();
        $(this).hide();
    });
    $('#reviewBt').click(function() {
        reviewQuiz();
    });
    $('#redoBt').click(function() {
        location.reload();
    });

    $('.choice').click(function() {

        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
            $('#submitBt').hide();
        } else {
            $('#submitBt').fadeIn();
            $(this).parent().children('.choice').each(function() { // remove all other selections           
                $(this).removeClass('selected'); // remove selection                    
            });
            $(this).addClass('selected');
        }
    });

    $('#questionListBt').click(function() { // toggles question listing div
        if ($('#questionList').css('display') == 'none') {
            $('#questionList').slideDown('fast', 'swing'); // show list

            $('#noClick').css({
                'display': 'block',
                'height': window.innerHeight + "px",
                'width': window.innerWidth + "px"
            });

            $('#questionListBt img').attr('src', 'img/icon-contract.gif');
        } else {
            $('#questionList').slideUp('fast', 'swing'); // hide list
            $('#noClick').css('display', 'none');
            $('#questionListBt img').attr('src', 'img/icon-expand.gif');
        }
    });

    $('#questionList p').click(function() { // move user to page they specifically choose from the question navigator

        var myQ = $(this).parent().children().index(this); // capture which question was clicked
        changePage(myQ + 2);

        // $('#questionList').css('display', 'none'); // hide question list
        $('#response').css('display', 'none');
        $('#noClick').css('display', 'none');
        $('#reviewBt').css('display', 'none');

    });

    $(window).resize(function() {
        canvas_resize();
    });
}

function run() {

    // fadeIn quiz
    $('#splash').css('display', 'block');
    vertical_center();
    bg_resize();

    $('#header').fadeIn('slow', 'swing');
    $('#footer').fadeIn('slow', 'swing');
}

function nextPage(pg) { // when next button is pressed, determine the next pg

    var myQ = pg - 2; // get default next pg

    if (answered[myQ] == false || qu.done) { // if planned page/question hasn't been answered
        // proceed normally without intervention

    } else if (answered[myQ] == true || pg == totalPages) {
        /*  
            If next Q has been answered loop through questions, 
            starting at the first question,
            place user at first unanswered question.
            
            If all have been answered then end the quiz
        */

        //forward user to next unanswered question
        var len = answered.length;
        var nextPg; // set to totalPages so if all questions are answered then the user is just stepped through the questions

        if (myQ >= len - 1) {
            myQ = 0;
        }

        for (var i = 0; i < len; i++) {

            if (answered[i] == false) { // if question hasn't been answered then save that value
                nextPg = i + 2;

                break; // terminate for loop
            }
        }

        if (nextPg == undefined && qu.done == false) { // all questions have been answered

            qu.done = true;
            nextPg = totalPages;
        }

        pg = nextPg;
    }

    changePage(pg); // bring user to this page
}

function changePage(pg) {

    if (pg != currentPage) { // only execute if selecting a new page            

        $('#pageNum').html(pg + " / " + totalPages); // set page # in top right 

        $('#canvas .page:nth-child(' + currentPage + ')').hide(); // fadeOut old
        $('#canvas .page:nth-child(' + pg + ')').fadeIn('slow', 'swing'); // fadeIn new 
        $('#canvas').scrollTop(0, 0); // move page back to top if it's been scrolled down.

        currentPage = pg; // update currentpage 

        // if page has been answered already then lock this question.
        if (pg == totalPages) {

            $('#submitBt').css('display', 'none'); // hide 
            $('#nextBt').css('display', 'none'); // hide 
            $('#reviewBt').fadeIn('slow', 'swing'); // show 
            $('#redoBt').fadeIn('slow', 'swing'); // show 
            $('#score').scrollTop(0);

        } else if (answered[pg - 2]) {

            $('#canvas .page:nth-child(' + pg + ') a.choice').each(function() { // remove interactivity
                $(this).unbind('click'); // remove click listener
                if ($(this).hasClass('locked') == false) { // add locked class
                    $(this).addClass('locked');
                }
            });
            $('#nextBt').css('display', 'block'); // show nextBt
            $('#submitBt').css('display', 'none'); // hide submitBt         

        } else {
            $('#nextBt').css('display', 'none');
            // $('#submitBt').fadeIn('slow', 'swing'); // fadeIn submitBt
        }

    }
}

function checkAnswer() {

    if ($('.page:nth-child(' + currentPage + ') .selected').length > 0) { // if an answer has the class .selected       

        var myQ = currentPage - 2;
        answered[myQ] = true; // note that this question has been answered.
        var response = "<p>" + quiz[myQ + 3][1] + "</p>";

        var myAText;
        var myANum;

        $('.page:nth-child(' + currentPage + ') .choice').each(function(i) { // loop through choices looking for correct answer     
            if ($(this).hasClass('selected')) { // check choice
                myANum = i; // save choice number
                myAText = $(this).html(); // save choice text
            }
        });

        qValue = quiz[myQ + 3][myANum + 2][1];

        // update questionList
        if (qu.type == 1 || qu.type == 2) { // if quiz questions have 1 right answer then show "x" or checkmark
            if (qValue == 1) {
                response = "<h3>" + txt.correct + "</h3>" + response;
                $('#questionList .listing p:nth-child(' + (myQ + 1) + ')').addClass('right');
            } else {
                response = "<h3>" + txt.wrong + "</h3>" + response;
                $('#questionList .listing p:nth-child(' + (myQ + 1) + ')').addClass('wrong');
            }
        } else {
            $('#questionList .listing p:nth-child(' + (myQ + 1) + ')').addClass('pt' + qValue);
        }

        score += qValue; // update score
        $('#score h2').html('Your score is ' + score + '.'); // set score on final page

        if (response.length < 1) {
            nextPage(currentPage + 1); // advance page if there is no response

        } else {
            $('#noClick').css({
                'display': 'block',
                'height': window.innerHeight + "px",
                'width': window.innerWidth + "px"
            });

            $('#response div').html(response); // set response
            $('#response').fadeIn('fast', 'swing'); //.css("width", window.innerWidth + "px"); // show response            
        }

    } else {
        alert(txt.noSelection);
    }
}

function reviewQuiz() {

    changePage(2); // turn to first question page
    $('#reviewBt').fadeOut('slow', 'swing'); // hide reviewBt   
}

function OrphanFilter(myString) {

    // insert non-breaking space between last two words of string so there is never one word on it's own line.
    var lastSpace = myString.lastIndexOf(" ");
    if (lastSpace != -1) {
        myString = myString.substring(0, lastSpace) + "&nbsp;" + myString.substring(lastSpace + 1);
    }
    myString = myString.replace("-", "&#8209;"); // use non-breaking hyphen

    return myString;
}

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
        vars[key] = value;
    });
    return vars;
}

$(document).ready(function() {

    // run once everything is loaded
    // init_jquery();
});

window.onload = function() {

    // run once the dom is loaded
    init_html();
};
