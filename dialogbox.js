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

        const TEXT_TOP_MARGIN = 570
        const TEXT_LEFT_MARGIN = 120
        const TEXT_RIGHT_MARGIN = TEXT_LEFT_MARGIN
        const HIGHLIGHT_PADDING = 0

        // the bottom left corner of the current letter we are typing = cursor
        let cursor = new p5.Vector(TEXT_LEFT_MARGIN, TEXT_TOP_MARGIN)
        const HIGHLIGHT_BOX_HEIGHT = textAscent() + textDescent()

        /*  display the entire passage without text wrap
         */
        for (let i = 0; i < this.index; i++) {
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
            if (this.text[i] === ' ') {
                // don't display
            } else text(this.text[i], cursor.x, cursor.y)

            /*  modify cursor position to where the next letter should be.
             */
            cursor.x += wordWidth(this.text[i])

            // this is the horizontal coordinate where we must text wrap
            const LINE_WRAP_X_POS = width - TEXT_RIGHT_MARGIN

            /*  if we're at a whitespace, determine if we need a new line:
                    find the next whitespace
                    the word between us and that whitespace is the next word
                    if the width of that word + our cursor + current space >
                     limit, then newline
             */
            if (this.text[i] === ' ') {
                let ndi = this.text.indexOf(" ", i + 1) // next delimiter index
                let nextWord = this.text.substring(i + 1, ndi)

                if (wordWidth(nextWord) +
                    wordWidth(this.text[i]) +
                    cursor.x > LINE_WRAP_X_POS) {
                    cursor.y += HIGHLIGHT_BOX_HEIGHT + 5
                    /* 5 is additional height to match dread's line-height*/

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

}