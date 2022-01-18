/**

@author Kiwi
@date 2022.01.16

this project attempts to replicate the animated dialog box in Metroid Dread
that appears whenever Adam is speaking.

coding plan
 switch font → verify giga.ttf doesn't work
 switch textWidth to wordWidth
 implement simple memoization in setup
 refactor

 ☒ add artaria.mp3
 ☒ update passage.json with full text and indices
 ☒ update passage.json correct durations via audacity
 add 'ADAM' text in correct color
 breathing triangle
 the text rate is faster than the speech

 optional: textFrame animation at 0:16

 🌟 try to use the debugger more
*/

let font
let cam // easycam!
let adamVoice // mp3 file playing sound effects from samus meeting adam
let playing // flag for whether the sound is playing
let voiceStartMillis // ms elapsed until we start our audio

/**
 * this can't be large because our charWidth graphics buffer is of finite
 * size! note that we must also take into account our webpage scaling in
 * chrome; I have it set at 125%, a significant bump up from default.
 * @type {number}
 */
const FONT_SIZE = 24 /* the font in-game is bold. this needs to be even */
const LETTER_SPACING = 1.25
const SPACE_WIDTH = FONT_SIZE / 2


// define the hue and saturation for all 3 axes
const X_HUE = 0, X_SAT = 80, Y_HUE = 90, Y_SAT = 80, Z_HUE = 210, Z_SAT = 80
const DIM = 40 // brightness value for the dimmer negative axis
const BRIGHT = 75 // brightness value for the brighter positive axis

let dialogBox
let mode_2D = false

let passages // our json file input
let lastPassageAdvanceTime = 0 // when was the last passage advance?

function preload() {
    font = loadFont('data/giga.ttf') // doesn't work due to textWidth issues
    // font = loadFont('data/meiryo.ttf')
    passages = loadJSON('passages.json')
    adamVoice = loadSound('data/artaria.mp3')
    playing = false
}

/* empty dictionary for our word length cache */
let cache = {}

/* populate an array of passage text */
let textList = []

/* grab other information: ms spent on each passage, highlights */
let highlightList = [] // a list of tuples specifying highlights and indexes
let msPerPassage = 0 // how long to wait before advancing a passage

function setup() {
    createCanvas(1280, 720, WEBGL)
    cam = new Dw.EasyCam(this._renderer, {distance: 240});

    colorMode(HSB, 360, 100, 100, 100)
    textFont(font, FONT_SIZE)

    /* 'in' makes our variable the index, while 'of' makes it the value! */
    for (let key in passages) {
        textList.push(passages[key]['text'])

        // for (let highlightKey in passages[key]['highlightIndices'])
        //     highlightList.push(passages[key]['highlightIndices'])
        highlightList.push(passages[key]['highlightIndices'])
        msPerPassage = passages[key]['ms']
    }

    /* we can also use the Object.keys method to grab keys from JSON!
    for (let i = 0; i < Object.keys(passages).length; i++) {
        console.log(passages[i].highlightIndices)
    } */

    // TODO add arguments to DialogBox: tpp, hll
    dialogBox = new DialogBox(textList, highlightList, msPerPassage)
}

function draw() {
    background(234, 34, 24)

    ambientLight(250);
    directionalLight(0, 0, 10, .5, 1, 0); // z axis seems inverted
    drawBlenderAxes()
    displayHUD()

    if (playing) {
        dialogBox.renderTextFrame(cam)
        dialogBox.renderText(cam)

        if (frameCount % 1 === 0) {
            dialogBox.advanceChar()
        }

        if (millis() - lastPassageAdvanceTime > 4000) {
            dialogBox.nextPassage()
            lastPassageAdvanceTime = millis()
        }
    }
}

function displayHUD() {
    cam.beginHUD(this._renderer, width, height)
    const PADDING = 10
    const LETTER_HEIGHT = textAscent()

    textFont(font, 10)

    // display the colors of the axes
    fill(X_HUE, X_SAT, BRIGHT)
    text("x axis", PADDING, height - LETTER_HEIGHT * 3)

    // green y axis
    fill(Y_HUE, Y_SAT, BRIGHT)
    text("y axis", PADDING, height - LETTER_HEIGHT * 2)

    // blue z axis
    fill(Z_HUE, Z_SAT, BRIGHT)
    text("z axis", PADDING, height - LETTER_HEIGHT)
    cam.endHUD()
}


// draw axes in blender colors, with negative parts less bright
function drawBlenderAxes() {
    const ENDPOINT = 10000
    strokeWeight(1)

    // red x axis
    stroke(X_HUE, X_SAT, DIM)
    line(-ENDPOINT, 0, 0, 0, 0, 0)
    stroke(X_HUE, X_SAT, BRIGHT)
    line(0, 0, 0, ENDPOINT, 0, 0)

    // green y axis
    stroke(Y_HUE, Y_SAT, DIM)
    line(0, -ENDPOINT, 0, 0, 0, 0)
    stroke(Y_HUE, Y_SAT, BRIGHT)
    line(0, 0, 0, 0, ENDPOINT, 0)

    // blue z axis
    stroke(Z_HUE, Z_SAT, DIM)
    line(0, 0, -ENDPOINT, 0, 0, 0)
    stroke(Z_HUE, Z_SAT, BRIGHT)
    line(0, 0, 0, 0, 0, ENDPOINT)
}


// prevent the context menu from showing up :3 nya~
document.oncontextmenu = function () {
    return false;
}

/* Fixes: sound being blocked https://talonendm.github.io/2020-11-16-JStips/
   Errors messages (CTRL SHIFT i) Chrome Developer Tools:
   The AudioContext was not allowed to start. It must be resumed (or
   created)  after a user gesture on the page. https://goo.gl/7K7WLu

   Possibly unrelated: maybe we need to add sound.js.map too.
   DevTools failed to load SourceMap: Could not load content for
   https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.1.9/addons/p5.sound.min.js.map
   : HTTP error: status code 404, net::ERR_HTTP_RESPONSE_CODE_FAILURE
 */
function touchStarted() {
    if (getAudioContext().state !== 'running') {
        getAudioContext().resume().then(r => {});
    }
}

function keyPressed() {
    if (!playing && key === 's') {
        adamVoice.play()
        voiceStartMillis = millis()
        playing = true
    }
}