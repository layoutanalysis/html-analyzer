var config = {
    'media': [
        {name:"Clarin", jsonFile:"data/all_css/clarin.2007-2017.json"},
        {name:"Clarin 2009-2018", jsonFile:"data/all_css/getcomputedvalue/clarin.2009-2018.monthly.nd.json"},
        {name:"Die Presse", jsonFile:"data/all_css/diepresse.2007-2017.json"},
        {name:"Die Presse 2009-2018", jsonFile:"data/all_css/getcomputedvalue/diepresse.2009-2018.monthly.nd.json"},
        {name:"El Pais", jsonFile:"data/all_css/elpais.2007-2017.json"},
        {name:"El Pais 2009-2018", jsonFile:"data/all_css/getcomputedvalue/elpais.2009-2018.monthly.nd.json"},
        {name:"El Universal", jsonFile:"data/all_css/eluniversal.2007-2017.json"},
        {name:"Guardian", jsonFile:"data/all_css/guardian.2007-2017.json"},
        {name:"Guardian 2009-2018", jsonFile:"data/all_css/getcomputedvalue/guardian.2009-2018.monthly.nd.json"},
        {name:"New York Times", jsonFile:"data/all_css/nytimes.2007-2017.json"},
        {name:"O Globo", jsonFile:"data/all_css/oglobo.2007-2017.json"},
        {name:"Repubblica", jsonFile:"data/all_css/repubblica.2007-2017.json"},
        {name:"Sueddeutsche Zeitung", jsonFile:"data/all_css/sz.2007-2017.json"},
        {name:"Le Figaro", jsonFile:"data/all_css/lefigaro.2007-2017.json"},
        {name:"Le Figaro 2009-2018", jsonFile:"data/all_css/getcomputedvalue/figaro.2009-2018.monthly.nd.json"},

    ],
    'cssProperties':[
        {group:"Typography", properties: ['font-family', 'font-weight', 'font-size','font-variant','line-height','color','font-stretch']},
        {group:"Width/Height", properties: ['width','height', 'max-width', 'max-height']},
        {group:"Padding", properties: ['padding-bottom', 'padding-top', 'padding-left','padding-right']},
        {group:"Margin", properties: ['margin-bottom', 'margin-left', 'margin-right','margin-top']},
        {group:"Positioning", properties: ['top','bottom', 'left', 'right']},
        {group:"Background", properties: ['background-image', 'background-color', 'background-offset','background-origin','background-position', 'background-repeat','background-size']},
        {group:"Border", properties: ["border-bottom","border-left","border-width","border-style","border-color","border-collapse","border-radius","border-spacing"]}
    ]
}

config.allCSSProperties = _.flatten(_.pluck(config.cssProperties,'properties'));
config.preselectedProperties = _.without(config.allCSSProperties,'background-image', 'background-offset','background-origin','background-position', 'background-repeat','background-size','border-collapse','font-stretch')