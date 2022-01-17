/*  return the width in pixels of char using the pixels array */
function charWidth(char) {
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
    for (let x = 0; x < g.width; x++)
        for (let y = 0; y < g.height; y++) {
            /* 🌟 there are two methods below: .get() and pixels[]. use one */

            // the .get() strategy. slower than using pixels[] and loadpixels()
            // let c = g.get(x, y)
            // if (!(c[0] === 0 && c[1] === 0 && c[2] === 0 && c[3] === 255))
            //     max_x = Math.max(x, max_x)

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

    return max_x
}