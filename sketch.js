/**

@author Kiwi
@date 2021-11-19

this project attempts to replicate the animated dialog box in Metroid Dread
that appears whenever Adam is speaking.

coding plan
 switch font → verify giga.ttf doesn't work
 switch textWidth to wordWidth
 implement simple memoization in setup?

 🌟 try to use the debugger more

*/

let font
let cam // easycam!

/**
 * this can't be large because our charWidth graphics buffer is of finite
 * size! note that we must also take into account our webpage scaling in
 * chrome; I have it set at 125%, a significant bump up from default.
 * @type {number}
 */
const FONT_SIZE = 24
const LETTER_SPACING = 1.25
const SPACE_WIDTH = FONT_SIZE / 2


// define the hue and saturation for all 3 axes
const X_HUE = 0, X_SAT = 80, Y_HUE = 90, Y_SAT = 80, Z_HUE = 210, Z_SAT = 80
const DIM = 40 // brightness value for the dimmer negative axis
const BRIGHT = 75 // brightness value for the brighter positive axis

let sketch
let mode_2D = false

let passages // our json file input
let lastPassageAdvanceTime = 0 // when was the last passage advance?

function preload() {
    font = loadFont('data/giga.ttf') // doesn't work due to textWidth issues
    // font = loadFont('data/meiryo.ttf')
    passages = loadJSON("passages.json")

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

    /* we can also use the Object.keys method to grab keys from JSON! */
    for (let i = 0; i < Object.keys(passages).length; i++) {
        console.log(passages[i].highlightIndices)
    }

    // TODO add arguments to DialogBox: tpp, hll
    sketch = new DialogBox(textList, highlightList, msPerPassage)
}

function draw() {
    background(234, 34, 24)

    ambientLight(250);
    directionalLight(0, 0, 10, .5, 1, 0); // z axis seems inverted
    drawBlenderAxes()
    displayHUD()

    sketch.renderTextFrame(cam)
    sketch.renderText(cam)

    if (frameCount % 1 === 0) {
        sketch.advanceChar()
    }

    if (millis() - lastPassageAdvanceTime > 4000) {
        sketch.nextPassage()
        lastPassageAdvanceTime = millis()
    }

    /*  to get around the unconnected beginShape problem in WEBGL, maybe we can
        use a p5Image and output the result of the 2D image as an overlay in
        3D? let's focus on drawing the 2D image first.
     */
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


/**
 * Returns the width of a word using individual widths from
 * charWidth_pixels. Spaces are taken care of separately due to
 * gigamarujr.ttf having an error in its space character.
 */
function wordWidth(word) {
    let sum = 0;
    [...word].forEach(w => {
        if (w === ' ')
            sum += SPACE_WIDTH
        else
            sum += charWidth(w) + LETTER_SPACING
    })

    return sum
}

/*  return the width in pixels of char using the pixels array */
function charWidth(char) {
    if (cache[char]) {
        // console.log(`cached answer returned: ${cache[char]}`)
        return cache[char]
    } else {
        /**
         * create a graphics buffer to display a character. then determine its
         * width by iterating through every pixel. Noting that 'm' in size 18
         * font is only 14 pixels, perhaps setting the buffer to a max width of
         * FONT_SIZE is sufficient. The height needs to be a bit higher to
         * account for textDescent, textAscent. x1.5 is inexact, but should be
         * plenty.
         * @type {p5.Graphics}
         */
        let g = createGraphics(FONT_SIZE, FONT_SIZE * 1.5)
        g.colorMode(HSB, 360, 100, 100, 100)
        g.textFont(font, FONT_SIZE)
        g.background(0, 0, 0)
        g.fill(0, 0, 100)

        /**
         *  the base height of g is g.height; this is an approximation of what
         *  would fit most characters. utterly untested but seems okay with
         *  large paragraphs. A lowercase 'm' is about ⅓ the height of
         *  textAscent + textDescent.; a 'j' is ⅔.
         */
        g.text(char, 0, g.height - FONT_SIZE / 2)
        g.loadPixels()

        let pd = g.pixelDensity()
        let offset
        let max_x = 0 /* the maximum x position we've seen a non-black pixel */

        /*  a pixel value "fails" if it's not [0, 0, 0, 255] which indicates
         black. so if redFail is true, that means red is not 0. if alphaFail
         is true, it means alpha is not 255.
         */
        let redFail, greenFail, blueFail, alphaFail

        /* iterate through every pixel in pixels[] array */
        for (let x = 0; x < g.width; x++) {
            for (let y = 0; y < g.height; y++) {
                /* 🌟 there are two methods below: .get() and pixels[]. use one */

                // the .get() strategy. slower than using pixels[] and
                // loadpixels() let c = g.get(x, y) if (!(c[0] === 0 && c[1]
                // === 0 && c[2] === 0 && c[3] === 255)) max_x = Math.max(x,
                // max_x)

                // the pixels[] strategy. about twice the speed as .get()

                offset = (y * g.width + x) * pd * 4
                // pixel values are rgba in the format [r, g, b, a]
                redFail = (offset % 4 === 0 && g.pixels[offset] !== 0)
                greenFail = (offset % 4 === 1 && g.pixels[offset] !== 0)
                blueFail = (offset % 4 === 2 && g.pixels[offset] !== 0)
                alphaFail = (offset % 4 === 3 && g.pixels[offset] !== 255)

                if (redFail || greenFail || blueFail || alphaFail)
                    max_x = Math.max(x, max_x)
            }
        }

        cache[char] = max_x
        return max_x
    }
}


// prevent the context menu from showing up :3 nya~
document.oncontextmenu = function () {
    return false;
}