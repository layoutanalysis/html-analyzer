var config = {
    'media': [
        {name:"Clarin", jsonFile:"data/all_css/clarin.cssstats.min.json"},
        {name:"Die Presse", jsonFile:"data/all_css/diepresse.cssstats.json"},
        {name:"El Pais", jsonFile:"data/all_css/elpais.cssstats.min.json"},
        {name:"El Universal", jsonFile:"data/all_css/eluniversal.cssstats.json"},
        {name:"Guardian", jsonFile:"data/all_css/guardian.cssstats.json"},
        {name:"New York Times", jsonFile:"data/all_css/nytimes.cssstats.json"},
        {name:"O Globo", jsonFile:"data/all_css/oglobo.cssstats.json"},
        {name:"Repubblica", jsonFile:"data/all_css/repubblica.cssstats.json"},
        {name:"Sueddeutsche Zeitung", jsonFile:"data/all_css/sz.cssstats.json"},
    ],
    'cssProperties':[
        {group:"Typography", properties: ['font','font-family', 'font-weight', 'font-size','font-variant','line-height','color']},
        {group:"Width & Height", properties: ['width','height', 'max-width', 'max-height']},
        {group:"Background", properties: ['background','background-image', 'background-color', 'background-offset']}
    ]
}