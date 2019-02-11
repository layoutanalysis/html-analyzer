var config = {
    'media': [
        {name:"Clarin", jsonFile:"data/all_css/clarin.2007-2017.json"},
        {name:"Die Presse", jsonFile:"data/all_css/diepresse.2007-2017.json"},
        {name:"El Pais", jsonFile:"data/all_css/elpais.2007-2017.json"},
        {name:"El Universal", jsonFile:"data/all_css/eluniversal.2007-2017.json"},
        {name:"Guardian", jsonFile:"data/all_css/guardian.2007-2017.json"},
        {name:"New York Times", jsonFile:"data/all_css/nytimes.2007-2017.json"},
        {name:"O Globo", jsonFile:"data/all_css/oglobo.2007-2017.json"},
        {name:"Repubblica", jsonFile:"data/all_css/repubblica.2007-2017.json"},
        {name:"Sueddeutsche Zeitung", jsonFile:"data/all_css/sz.2007-2017.json"},
        {name:"Le Figaro", jsonFile:"data/all_css/lefigaro.2007-2017.json"},

    ],
    'cssProperties':[
        {group:"Typography", properties: ['font-family', 'font-weight', 'font-size','font-variant','line-height','color','font-stretch']},
        {group:"Width/Height", properties: ['width','height', 'max-width', 'max-height']},
        {group:"Padding", properties: ['padding-bottom', 'padding-top', 'padding-left','padding-right']},
        {group:"Margin", properties: ['margin-bottom', 'margin-left', 'margin-right','margin-top']},
        {group:"Positioning", properties: ['top','bottom', 'left', 'right']},
        {group:"Background", properties: ['background-image', 'background-color', 'background-offset','background-origin','background-position', 'background-repeat','background-size']},
        {group:"Border", properties: ["border-bottom","border-left","border-width","border-style","border-color","border-collapse","border-radius","border-spacing"]}
    ],
    'commonCSSProperties': "background background-attachment background-color background-image background-position background-repeat border border-bottom border-bottom-color border-bottom-style border-bottom-width border-color border-left border-left-color border-left-style border-left-width border-right border-right-color border-right-style border-right-width border-style border-top border-top-color border-top-style border-top-width border-width clear clip color cursor display filter float font font-family font-size font-variant font-weight height left letter-spacing line-height list-style list-style-image list-style-position list-style-type margin margin-bottom margin-left margin-right margin-top overflow padding padding-bottom padding-left padding-right padding-top page-break-after page-break-before position stroke-dasharray stroke-dashoffset stroke-width text-align text-decoration text-indent text-transform top vertical-align visibility width z-index".split(" ")
}

config.allCSSProperties = _.flatten(_.pluck(config.cssProperties,'properties'));
config.preselectedProperties = _.without(config.allCSSProperties,'background-image', 'background-offset','background-origin','background-position', 'background-repeat','background-size','border-collapse','font-stretch')