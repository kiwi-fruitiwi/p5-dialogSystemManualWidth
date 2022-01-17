class DialogBox {
    constructor(passages, highlightIndices, msPerPassage) {
        /*  contains an array of passage texts:
                ["passage 1...", "passage 2...", "passage 3...", etc.]
         */
        this.passageList = passages
        this.index = 0 // the char index we are currently displaying
        this.passageIndex = 0 // which passage in our passage array are we on?
        this.passage = this.passageList[this.passageIndex]

        this.LEFT_MARGIN = 50
        this.RIGHT_MARGIN = this.LEFT_MARGIN
        this.BOTTOM_MARGIN = 10
        this.HEIGHT = 120

        this.boxWidth = width - this.LEFT_MARGIN - this.RIGHT_MARGIN
        this.textFrame = loadImage('data/textFrame.png')
        this.text = this.passageList[0]

        // list of hardcoded (start, end) specifying which words to highlight
        this.highlightIndices = highlightIndices

        /*  TODO
                hardcode highlightIndices
                triangle
                time characters per section in Dread for advanceChar
                better times: synchronize with video
                JSON input for passages and indices
                    https://p5js.org/reference/#/p5/loadJSON

                ...
                make adam show up
                port to java
                polish lengths for text box frame to make sure they are accurate
         */
    }


    /*  advance to the next passage
        how will this be called?

     */
    nextPassage() {
        if (this.passageIndex === this.passageList.length - 1) {
            console.log("and we're done! :Sal's voice:")
        } else {
            this.passageIndex += 1
            this.text = this.passageList[this.passageIndex]

            // reset the current passage index so we restart at beginning
            this.index = 0
        }
    }

    // advances the current char in the current passage, but does nothing if
    // we are at the end
    advanceChar() {
        if (this.index < this.text.length - 1) {
            this.index += 1
        }
    }

    // display the current passage up to the current index
    renderText(cam) {
        if (cam) cam.beginHUD(p5._renderer, width, height)
        /*  use text() to display characters with character wrap
            color(204, 4, 80) is the correct white text color
         */

        noStroke()
        let CHAR_POS = []

        const TEXT_TOP_MARGIN = 290
        const TEXT_LEFT_MARGIN = 75
        const TEXT_RIGHT_MARGIN = TEXT_LEFT_MARGIN
        const HIGHLIGHT_PADDING = 0

        // the bottom left corner of the current letter we are typing = cursor
        let cursor = new p5.Vector(TEXT_LEFT_MARGIN, TEXT_TOP_MARGIN)
        const HIGHLIGHT_BOX_HEIGHT = textAscent() + textDescent()

        /*  display the entire passage without text wrap
         */
        for (let i=0; i<this.index; i++) {
            // save the position of the ith character. we'll need this later
            CHAR_POS.push(cursor.copy())

            /*  draw current letter above (z-index) the highlight box
                color emphasized words yellow
             */

            fill(204, 4, 80) // default color

            // check highlightIndices to see if there's something to highlight
            let hlEntry = this.highlightIndices[this.passageIndex]

            // loop through hlEntry, a list of highlight indices. highlight!
            for (let e of hlEntry) {
                if (i >= e.start &&
                    i <= e.end) {
                    fill(63, 60, 75)
                }
            }

            // gigamarujr doesn't render spaces properly in JS, so we catch this
            if(this.text[i] == ' ') {
                // don't display
            } else text(this.text[i], cursor.x, cursor.y)

            /*  modify cursor position to where the next letter should be.
             */
            cursor.x += textWidth(this.text[i])
            // cursor.x += 10

            // console.log(textWidth(this.text[i]))

            // this is the horizontal coordinate where we must text wrap
            const LINE_WRAP_X_POS = width - TEXT_RIGHT_MARGIN

            /*  if we're at a whitespace, determine if we need a new line:
                    find the next whitespace
                    the word between us and that whitespace is the next word
                    if the width of that word + our cursor + current space >
                     limit, then newline
             */
            if (this.text[i] === ' ') {
                let ndi = this.text.indexOf(" ", i+1) // next delimiter index
                let nextWord = this.text.substring(i+1, ndi)

                if (textWidth(nextWord) +
                    textWidth(this.text[i]) +
                    cursor.x > LINE_WRAP_X_POS) {
                        cursor.y += HIGHLIGHT_BOX_HEIGHT

                        // don't forget to wrap the x coordinates! ᴖᴥᴖ
                        cursor.x = TEXT_LEFT_MARGIN
                }
            }
        }

        if (cam) cam.endHUD()
    }

    // loads the saved box texture with transparency
    renderTextFrame(cam) {
        cam.beginHUD(p5._renderer, width, height)
        image(this.textFrame, 0, 0, width, height)
        cam.endHUD()
    }


    /*  saves the output of render2DTextBox to a PGraphics object with
        transparency. we can save this and use image() to display later!
        this gets around several p5.js bugs in 3D
     */
    saveRenderedTextBoxImg() {
        const pg = createGraphics(width, height)
        pg.colorMode(HSB, 360, 100, 100, 100)

        // add render2DTextBox code here. don't forget extra pg. calls if
        // doing manually. now it's automatic because we pass in pg!
        this.render2DTextBox(pg)
        pg.save()
    }


    /*  renders the transparent dialog box. modify this function for use in
        saveRenderedImg. pg is "this" passed from sketch.js
     */
    render2DTextBox(pg) {
        /*  we want a rectangle without the corners, but the rounded border
            arguments in rect() don't work in WEBGL. let's make our own
            rectangle with the corners removed using beginShape and vertices!
         */

        /*
        rect(
            this.LEFT_MARGIN, // top left corner x
            height-this.HEIGHT-this.BOTTOM_MARGIN, // tlc y
            boxWidth, // width
            this.HEIGHT, // height
            50) // rounded borders don't work in WEBGL!
        */

        // these are the coordinates for the top left corner of our target box
        const x = this.LEFT_MARGIN
        const y = height-this.HEIGHT-this.BOTTOM_MARGIN
        const r = 3 // side length of the corner triangle
        const s = 3.5 // scaling factor of r to extend brackets in corners

        const TLC = new p5.Vector(x, y) // top left corner
        const TRC = new p5.Vector(x+this.boxWidth, y) // top right corner
        const BRC = new p5.Vector(x+this.boxWidth, y+this.HEIGHT) // bottom r.
        // corner
        const BLC = new p5.Vector(x, y+this.HEIGHT)
        const lineWeight = 2

        pg.fill(210, 62, 12, 75)
        pg.noStroke()
        pg.beginShape()

        // vertices around each of the four corners of the rectangle
        pg.vertex(TLC.x, TLC.y+r)
        pg.vertex(TLC.x+r, TLC.y)
        pg.vertex(TRC.x-r, TRC.y)
        pg.vertex(TRC.x, TRC.y+r)
        pg.vertex(BRC.x, BRC.y-r)
        pg.vertex(BRC.x-r, BRC.y)
        pg.vertex(BLC.x+r, BLC.y)
        pg.vertex(BLC.x, BLC.y-r)
        pg.endShape()

        // the cyan outline
        const cyan = color(188, 20, 94)
        pg.stroke(cyan)
        pg.strokeWeight(lineWeight)
        pg.noFill()

        // top border including corner guards
        pg.beginShape()
        // vertical line extending below TL corner guard
        pg.vertex(TLC.x, TLC.y+s*r)

        // TL corner bottom left point
        pg.vertex(TLC.x, TLC.y+r)

        // TL corner top right point
        pg.vertex(TLC.x+r, TLC.y)
        pg.vertex(TRC.x-r, TRC.y)
        pg.vertex(TRC.x, TRC.y+r)
        pg.vertex(TRC.x, TRC.y+s*r)
        pg.endShape()

        // bottom border including corner guards
        pg.strokeWeight(lineWeight)
        pg.beginShape()
        pg.vertex(BRC.x, BRC.y-s*r)
        pg.vertex(BRC.x, BRC.y-r)
        pg.vertex(BRC.x-r, BRC.y)
        pg.vertex(BLC.x+r, BLC.y)
        pg.vertex(BLC.x, BLC.y-r)
        pg.vertex(BLC.x, BLC.y-s*r)
        pg.endShape()

        const cornerGuardHorizontalScale = 0.108

        /** Corner guards! */
        // extra thick corner guard, top left
        pg.strokeWeight(lineWeight+1)
        pg.beginShape()
        pg.vertex(TLC.x+1, TLC.y+r+1) // BL corner
        pg.vertex(TLC.x+1+r, TLC.y+1) // TR corner
        pg.vertex(TLC.x+this.boxWidth*cornerGuardHorizontalScale, TLC.y+1)
        // ⅛ of boxWidth bold line
        pg.endShape()

        // extra thick corner guard, top right
        pg.strokeWeight(lineWeight+1)
        pg.beginShape()
        pg.vertex(TRC.x-this.boxWidth*cornerGuardHorizontalScale, TLC.y+1)
        pg.vertex(TRC.x-r-1, TRC.y+1)
        pg.vertex(TRC.x-1, TRC.y+r+1)
        pg.endShape()

        // extra thick corner guard, bottom right
        pg.strokeWeight(lineWeight+1)
        pg.beginShape()
        pg.vertex(BRC.x-1, BRC.y-1-r)
        pg.vertex(BRC.x-1-r, BRC.y-1)
        pg.vertex(BRC.x-this.boxWidth*cornerGuardHorizontalScale, BRC.y-1)
        pg.endShape()

        // extra thick corner guard, bottom right
        pg.strokeWeight(lineWeight+1)
        pg.beginShape()
        pg.vertex(BLC.x+this.boxWidth*cornerGuardHorizontalScale, BLC.y-1)
        pg.vertex(BLC.x+1+r, BLC.y-1)
        pg.vertex(BLC.x+1, BLC.y-1-r)
        pg.endShape()
    }


    /*  https://discourse.processing.org/t/textwidth-issues/14218/3
        manually calculates textWidth via looking at pixels
     */
    realTextWidth(texte){
        clear();

        // écrit le texte
        textAlign(LEFT, TOP);
        fill(255,0,0);
        textSize(100);
        text(texte, 0, 0);

        // ok la zone ou chercher un point noir
        const _x = Math.ceil(textWidth(texte));
        const _y = 0;
        const w = 300; // arbitraire
        const h = Math.floor(textAscent(texte));

        loadPixels();
        let max_x = _x; // coord du point non-blanc le plus éloigné

        for (let x = _x; x < _x+w; x++) {
            for (let y = _y; y < _y+h; y++) {

                let k = 4* (x + y*width); // le rang du lot de valeurs rgba

                if(pixels[k]>0){
                    max_x = Math.max(x, max_x);
                }
            }
        }
        // console.log(texte+' : '+i+ " itérations... "+_x+' / '+max_x);

        // si on cleare tout de suite on n'a même pas le temps de voir quoi que ce soit...
        clear();

        return max_x;

    }
}