
function roundDimension (cssValue, cssProperty){
    //return cssValue;
    if (cssValue > 500){
        return roundBy(cssValue,50);
    }
    if (cssValue > 100){
        return roundBy(cssValue,10);
    }
    if (cssValue > 25){
        return roundBy(cssValue,5);
    }

    return cssValue;
}

function roundBy(number,step){
    //rounds number to next step number
    return Math.round(number/step)*step;
}


var converters = [
    {
        properties: ['font-family'],
        converter: function (cssValue, cssProperty){
            var firstFont = cssValue.split(',')[0];
            firstFont = firstFont.split('"').join('').split("'").join('');
            if (firstFont.length > 3){
                return firstFont.toLowerCase();
            }
        }
    },
    {
        properties: `font-size line-height width height max-width max-height 
                     padding-left margin-left top left bottom`.split(" "),
        converter: function(cssValue, cssProperty){
            var raw = Math.round(parseFloat(cssValue, 10));



            if (cssValue.match(/px$/) || cssValue.match(/pt$/) ){
                return `${roundDimension(raw, cssProperty)}px`;
            }

            //TODO: query basefont size for rem
            if (cssValue.match(/em$/) || cssValue.match(/rem$/)){
                return `${roundDimension(raw*16, cssProperty)}px`;
            }

            if (cssProperty === "font-size") {
                var relative2px = {
                    'inherit': 16,
                    'xx-small': 9,
                    'x-small': 10,
                    'small': 13,
                    'medium': 16,
                    'large': 18,
                    'x-large': 24,
                    'xx-large': 32,
                    'small': 13,
                    'larger': 19
                }
                if (relative2px[cssValue]) {
                    return `${relative2px[cssValue]}px`;
                }
            }
        }
    },
    {
     properties: 'background-color color',
     converter: function (cssValue, cssProperty, idx, valueArray ){
         var color = tinycolor(cssValue);
         if (color){
            var rgbColor = color.toRgb(); 
            var roundedColor = tinycolor({
                r: roundBy(rgbColor.r,16),
                g:roundBy(rgbColor.b,16),
                b: roundBy(rgbColor.b,16), 
                a: rgbColor.a
            }); 
            return roundedColor.toRgbString();
         }
         
    }
}]
