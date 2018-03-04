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
        {name:"Le Figaro (used CSS only)", jsonFile:"data/all_css/lefigaro.2007-2017.used.json"},

    ],
    'cssProperties':[
        {group:"Typography", properties: ['font','font-family', 'font-weight', 'font-size','font-variant','line-height','color','font-stretch']},
        {group:"Width & Height", properties: ['width','height', 'max-width', 'max-height']},
        {group:"Padding", properties: ['padding','padding-bottom', 'padding-top', 'padding-left','padding-right']},
        {group:"Margin", properties: ['margin','margin-bottom', 'margin-left', 'margin-right','margin-top']},
        {group:"Absolute Positioning", properties: ['top','bottom', 'left', 'right']},
        {group:"Background", properties: ['background','background-image', 'background-color', 'background-offset','background-origin','background-position', 'background-repeat','background-size']},
        {group:"Border", properties: ["border","border-bottom","border-left","border-width","border-right","border-style","border-top","border-color","border-collapse","border-bottom-color","border-bottom-left-radius","border-bottom-right-radius","border-bottom-style","border-bottom-width","border-left-color","border-left-style","border-left-width","border-radius","border-right-color","border-right-style","border-right-width","border-spacing","border-top-color","border-top-left-radius","border-top-right-radius","border-top-style","border-top-width"]}
    ]
}