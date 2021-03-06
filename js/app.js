var ResultTable = Backbone.View.extend({
    initialize: function (options){
        this.options = options;
    },
    events: {
      "click .card-header": "toggleResultDetails"
    },
    cssValueTemplate: _.template(`
        <div class="css-property-values <%= property %>-values">
          Detail Template
        </div>`),
    toggleResultDetails: function (evt ){
       jQuery(evt.target).siblings(".card-body").toggle();
    },
    template: _.template(resultTableTemplate),
    render: function() {
        this.$el.html(this.template(this.options));
        return this;
    }
});

var SNAPSHOT_CACHE = {};


function loadSnapshotCollection (snapshotUrl, callback){
    if (snapshotUrl in SNAPSHOT_CACHE){
        callback(SNAPSHOT_CACHE[snapshotUrl]);
    }
    else {
        var snapshotColl = new Snapshots();
        SNAPSHOT_CACHE[snapshotUrl] = snapshotColl;
        var fetchOptions = {url: snapshotUrl};
        if (snapshotUrl.endsWith('.nd.json')){
            fetchOptions.dataFilter = function(data){
                //assume a minimum css stats length of 1999 chars to filter out webarchive error pages
                data = data.split("\n").filter(item => item.length > 1999).map(item => {
                    var jsonResult;
                    try {
                        jsonResult = JSON.parse(item);
                    } catch (err) {
                        console.log(err);
                    } finally {
                        return jsonResult;
                    }
                }).filter(item => {
                    if (item === undefined){
                        return false;
                    }
                    //filter out webarchive petabox error pages
                    if (item && item.title && item.title === "Welcome to the US Petabox"){
                        return false;
                    }
                    return true;
                });


                data = data.map(item => {
                    var itemUrl = item.url;
                    var processedProps = {};

                    var cssProperties = (item.properties || _.pick(item, config.allCSSProperties))

                    Object.entries(cssProperties).forEach(entry => {
                        let propName = entry[0];
                        let propValues = entry[1];

                        //round property values to full pixels
                        propValues = propValues.map(propVal => {
                            if (propVal && propVal.endsWith && propVal.endsWith('px')){
                                return Math.round(parseFloat(propVal)) + 'px';
                            }
                            return propVal;
                        });

                        //font-family to lowercase, only use first font -> more accurate similarity
                        if (propName === 'font-family'){
                            propValues = propValues.map(pVal => pVal.split(',')[0].toLowerCase());
                        }

                        //remove 0px border properties (browser default)
                        if (propName.startsWith('border')){
                            propValues = propValues.filter(pVal => !pVal.startsWith('0px '));
                        }
                        var uniquePropValues = Array.from(new Set(propValues));
                        processedProps[propName] = uniquePropValues;
                    
                    })
                

                    item = processedProps;
                    item.url = itemUrl;
                    var datePartSplitter1 = itemUrl.indexOf("//web.archive.org/web/") > -1 ? "//web.archive.org/web/" : "//web.archive.org/";
                    var datePartSplitter2 = itemUrl.indexOf('_im/') > -1 ? '_im/' : '/';
                    item["snapshot-date"] = itemUrl.split(datePartSplitter1)[1].split(datePartSplitter2)[0];
                    return item;
                })
                data.sort(function(a,b){
                    return parseInt(a["snapshot-date"]) -parseInt(b["snapshot-date"]);
                });
                return JSON.stringify(data);
            }
        }
        var jqXHR = snapshotColl.fetch(fetchOptions);
        jqXHR.done(function(){
           callback(snapshotColl);
        });
    }
}

var medium = '';
window.addEventListener('load', function(){
    document.getElementById('config-form').innerHTML = Mustache.to_html(configFormTemplate, config);
    $('.btn-primary').click(function(e){
        $('#results').empty();
        var jsonUrl = $('[name="medium"]').val();
        medium =  $('[name="medium"] :selected').text();
        loadSnapshotCollection(jsonUrl,collectionLoaded);
        e.preventDefault();
    });

    config.preselectedProperties.forEach(function(prop){
        document.getElementById(prop).checked=true;
    })

    //hardcode threshold to 45% (-2sigma) when choosing standard deviation
    $('#similarity-method').change(function(){
        var isStdDev =  $(this).val() === "stddev";
        $('#similarity-threshold').prop('disabled', isStdDev);
        $('#similarity-threshold').val(isStdDev ? 34:  $('#similarity-threshold').val());
    })
});


var changeCandidates;

function changeCandidatesToCSV() {
    var changes = changeCandidates;
    var csvFields = (['snapshotDate', '_is2Sigma', 'url','previousSnapshotUrl']).concat(changes.getAnalyzedProperties().sort());
    var csvOut = changes.map(function (change) {
        var csvAttrs = csvFields.map(function(field){
            var fieldVal = change.get(field);
            if (field === "snapshotDate"){
                return change.getDateString();
            }
            if (field === "previousSnapshotUrl"){
                return change.getPreviousSnapshot().get('url');
            }
            if (field === "_is2Sigma"){
                return (fieldVal === true ? "yes" :"")
            }
            if (_.isNumber(fieldVal) && fieldVal <= 1){
                return fieldVal.toFixed(4);
            }
            return fieldVal;
        });
        return Object.values(csvAttrs).join(";") + ";";
    });

    var csvHeader = csvFields.join(";") + ";";
    csvHeader = csvHeader.replace('_is2Sigma','Major Change?');
    csvOut.unshift(csvHeader);
    return csvOut.join('\r\n');
}

function downloadCSV (){
    var coll = changeCandidates;
    var collSource = coll.getCollectionSource();
    var newspaperName = collSource.split('/').pop().split('.')[0];
    var csvContent=changeCandidatesToCSV(); //here we load our csv data
    var blob = new Blob([csvContent],{
        type: "text/csv;charset=utf-8;"
    });

    var fileName = `${newspaperName}_${coll.getAnalyzedProperties().join('_')}`;
    saveAs(blob, `${fileName.slice(0,64)}.csv`);
}

function collectionLoaded (snapshotColl) {
    //console.log("Dissimilar Snapshots by CSS Property Font Family",collection.dissimilarByProperty('font-family'));
    console.time("analysis");
    var analyzedProperties = [].map.call(document.querySelectorAll('table :checked'), function(cb){return cb.id});

    if (analyzedProperties.length === 0){
        return alert("Please choose at least one CSS Property for Comparison");
    }
    
    var similarityMethod = $('#similarity-method').val();
    var similarityThreshold = parseInt($('#similarity-threshold').val(),10);
    //['font-family', 'color','width', 'height','margin-left','margin-right','background-color'];
    //var changeCandidates = snapshotColl.dissimilarInProperties(analyzedProperties);
    if (analyzedProperties.length === 0){
        
    }
    changeCandidates = snapshotColl.getDissimilarSnapshots({properties: analyzedProperties, method: similarityMethod, threshold: similarityThreshold});
    changeCandidates.each(snapshot => snapshot.calculateDiffToPrevious(analyzedProperties));

    var snapshotDates = snapshotColl.pluck("snapshotDate").slice(1);
    var datasets = analyzedProperties.map(function (prop) {
        return {data: snapshotColl.pluck(prop + '-similarity').slice(1), label: prop + "-similarity"}
    });

    if ($('[name="sort"]:checked').val()=== "similarity") {
        changeCandidates.comparator = "avg-similarity";
        changeCandidates.sort();
    }

    showSimilarityChart(snapshotDates, datasets);
    resultTable = new ResultTable({
        snapshots: changeCandidates,
       // compareAllProperties: compareAllProperties,
        analyzedProperties: analyzedProperties,
        totalNumberOfSnapshots: snapshotColl.length,
        medium: medium
    });
    $("#results").append(resultTable.render().el);
    console.timeEnd("analysis");
}

//});
//