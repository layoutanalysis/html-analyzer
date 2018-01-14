var Snapshot = Backbone.Model.extend({
    initialize: function (attributes, options){
        //this.calculateSimilarityToPrevious();
    },
    getNextSnapshot: function (){
        var ownIndex = this.collection.indexOf(this);
        if (ownIndex < this.collection.length - 1){
            return this.collection.at(ownIndex + 1);
        }
    },
    getCSSProperties: function (){
      return _(this.attributes).omit(function(value, key){
         return (key.indexOf("-similarity") > -1 || key.indexOf("-value") > -1 || key.indexOf("snapshotDate") > -1 || key === "url")
      });
    },
    getPreviousSnapshot: function (){
        var ownIndex = this.collection.indexOf(this);
        if (ownIndex > 0){
            return this.collection.at(ownIndex - 1);
        }
    },
    getValuesForProperty: function (property,changeType){
        //changeType: 'added' or 'removed'
        if (changeType){
            return this.get(property + '-' + changeType + '-values') || [];
        }
        return this.get(property) || [];
    },
    _resetCalculatedSimilarities: function(){
        var self = this;
        _(this.attributes).each(function(value, key){
           var isCalculatedAttr = key.indexOf('-values') > - 1 || key.indexOf('-similarity') > - 1;
           if (isCalculatedAttr){
               self.unset(key);
           }
        });
    },
    calculateDiffToPrevious: function (properties){
        var previous = this.getPreviousSnapshot();
        var self = this;
        if (previous) {
            properties.forEach(function (prop) {
                var previousValue = previous.get(prop) || [];
                var ownValue = self.get(prop) || [];
                self.set(prop + '-added-values', _.difference(ownValue, previousValue));
                self.set(prop + '-common-values', _.intersection(ownValue, previousValue));
                self.set(prop + '-removed-values', _.difference(previousValue, ownValue));
            });
        }
    },
    calculateSimilarityToPrevious: function(properties){

        var previous = this.getPreviousSnapshot();

        var self = this;
        var similarities = [];
        var properties = properties;

        if (previous){
            if (properties === undefined) {
                var ownCssAttributes = _(this.getCSSProperties()).keys();
                var previousCssAttributes = _(previous.getCSSProperties()).keys();
                var unifiedAttributes = _.union(ownCssAttributes, previousCssAttributes);
                properties = unifiedAttributes;
            }
            _(properties).each(function(attr){
                var previousValue = previous.get(attr) || [];
                var ownValue = self.get(attr) || [];
                var similarity = self.getJaccardSimilarity(previousValue, ownValue);
                self.set(attr + '-similarity', similarity);
                similarities.push(similarity);
            });
            self.set("avg-similarity",jStat.mean(similarities));
        }
    },
    getJaccardSimilarity: function (arr1, arr2){
        return (_.intersection(arr1,arr2).length / _.union(arr1, arr2).length) || 0;
    },
    formatPropertyValue: function(cssProperty, cssValues){
        var valueTemplate = 'default';
        if (cssProperty.indexOf('color') > - 1){
            valueTemplate = 'color';
        }

        if (cssProperty.indexOf('width') > -1 || cssProperty.indexOf('height') > -1 || cssProperty.indexOf('margin') > -1){
            valueTemplate = 'dimension'
        }

        if (cssProperty.indexOf('font-family') > -1){
            valueTemplate = 'fontFamily';
        }

        return Mustache.to_html(cssValueTemplates['base'], {cssProperty: cssProperty, cssValues: cssValues}, {cssValuesTemplate: cssValueTemplates[valueTemplate]});
    },
    parse: function (data, options){
        var attributes = {};
        var cssProps = data.declarations.properties;
        var cssWithoutVendorProperties = _.omit(cssProps,function(value,prop){
           return prop.startsWith('-');
        });

        //no duplicate values
        cssWithoutVendorProperties = _.mapObject(cssWithoutVendorProperties, function(value, prop){
           return _.uniq(value);
        });

        _.extend(attributes, cssWithoutVendorProperties);
        attributes['url'] = data['url'];
        attributes['snapshotDate'] = data['snapshot-date'];
        return attributes;
    }
})

var Snapshots = Backbone.Collection.extend({
    model:Snapshot,
    idAttribute: "url",
    comparator: "snapshotDate",
    url:"data/all_css/clarin.cssstats.min.json",
    dissimilarByProperty: function (cssProperty){
        var propSimilarities = this.pluck(cssProperty + '-similarity');
        propSimilarities = _.compact(propSimilarities);
        var avgSimilarities = jStat.mean(propSimilarities);
        var stdDevSimilarities = jStat.stdev(propSimilarities, true);

        return this.filter(function(snapshot){
            var snapshotSimilarity =  snapshot.get(cssProperty + '-similarity');
            return _.isNumber(snapshotSimilarity) && (snapshotSimilarity < (avgSimilarities - stdDevSimilarities));
        });
    },
    getUsedCSSProperties: function (){
        var snapshotProperties = this.map(function(snapshot){
           return _(snapshot.getCSSProperties()).keys();
        });
        return _.uniq(_.flatten(snapshotProperties)).sort();
    },
    _resetCalculatedSimilarities: function (){
        this.each(function(snapshot){
           snapshot._resetCalculatedSimilarities();
        });
    },
    getDissimilarSnapshots: function (options){
        var cssProperties = options.properties;
        var threshold = options.sigmaThreshold;

        var prefixedProps = _(cssProperties).map(function(prop){
            return prop + '-similarity';
        });
        this._resetCalculatedSimilarities();

        //TODO: only calculate similarity for requested properties
        this.each(function(snapshot){
            snapshot.calculateSimilarityToPrevious();
        });


        var getPropSimilarityBySnapshot = function(snapshot){
            var snapshotJSON = snapshot.toJSON();
            var propSims = _(prefixedProps).map(function(prop){
                if (_.isNumber(snapshotJSON[prop])){
                    return snapshotJSON[prop];
                }
                return 1;
            });
            return jStat.mean(propSims);
        }

        var avgPropsSimilarities = this.map(getPropSimilarityBySnapshot);

        avgPropsSimilarities = _.compact(avgPropsSimilarities);
        var avgSimilarities = jStat.mean(avgPropsSimilarities);
        var stdDevSimilarities = jStat.stdev(avgPropsSimilarities, true);

        return this.filter(function(snapshot){
            var snapshotSimilarity =  getPropSimilarityBySnapshot(snapshot);
            return _.isNumber(snapshotSimilarity) && (snapshotSimilarity < (avgSimilarities - stdDevSimilarities));
        });
    },

});


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
        var jqXHR = snapshotColl.fetch({url: snapshotUrl});
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
});


//clarinSnapshots.on("sync", function(snapshots){
function collectionLoaded (snapshotColl) {
    //console.log("Dissimilar Snapshots by CSS Property Font Family",collection.dissimilarByProperty('font-family'));
    console.time("analysis");
    var analyzedProperties = $('#properties').val();
    //['font-family', 'color','width', 'height','margin-left','margin-right','background-color'];
    //var changeCandidates = snapshotColl.dissimilarInProperties(analyzedProperties);
    var changeCandidates = snapshotColl.getDissimilarSnapshots({properties: analyzedProperties, sigmaThreshold: 0.82});
    changeCandidates.forEach(snapshot => snapshot.calculateDiffToPrevious(analyzedProperties));

    var snapshotDates = snapshotColl.pluck("snapshotDate").slice(1);
    var datasets = analyzedProperties.map(function (prop) {
        return {data: snapshotColl.pluck(prop + '-similarity').slice(1), label: prop + "-similarity"}
    });
    showSimilarityChart(snapshotDates, datasets);
    resultTable = new ResultTable({
        snapshots: changeCandidates,
        analyzedProperties: analyzedProperties,
        totalNumberOfSnapshots: snapshotColl.length,
        medium: medium
    });
    $("#results").append(resultTable.render().el);
    console.timeEnd("analysis");
}

//});
//