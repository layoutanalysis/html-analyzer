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
        var intersection = _.intersection(arr1,arr2).length;
        var union = _.union(arr1, arr2).length;

        //special case: both arrays are empty, but 100% similar
        if (intersection === 0 && union === 0){
            return 1;
        }

        return (intersection / union)  || 0;
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
    getDateString: function (){
        // return snapshot date in the format YYYY-MM-DD
        var sDate = this.get('snapshotDate');
        return ([sDate.slice(0,4), sDate.slice(4,6), sDate.slice(6,8)].join('-'));
    },
    parse: function (data, options){
        var attributes = {};
        var cssProps = data.declarations ? data.declarations.properties: data;
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
    getAnalyzedProperties: function (){
        return this.at(0).keys().filter(function(attr){
            return attr.endsWith("-similarity");
        });
    },
    getCollectionSource: function (){
        // returns url of collection datasource
        // even if collection was instantiated with filtered models
        return this.at(0).collection.url;
    },
    getUsedCSSProperties: function (){
        var mostCommonCSSProperties = config.allCSSProperties;
        var snapshotProperties = this.map(function(snapshot){
            return _(snapshot.getCSSProperties()).keys();
        });
        var usedProps =  _.uniq(_.flatten(snapshotProperties)).sort();
        var filteredUsedProps = _.intersection(mostCommonCSSProperties, usedProps); //filter properties to avoid mistyped or vendor-specific css properties.
        return filteredUsedProps;
    },
    _resetCalculatedSimilarities: function (){
        this.each(function(snapshot){
            snapshot._resetCalculatedSimilarities();
        });
    },
    getDissimilarSnapshots: function (options){
        var cssProperties = options.properties;
        var method = options.method;
        var threshold = options.threshold / 100;

        //use hardcoded 2sigma stddev for now.
        if (options.method === "stddev") {
            threshold = 0.82;
        }

        //no properties were selected, we use all properties
        if (cssProperties.length === 0){
            cssProperties = this.getUsedCSSProperties();
        }

        var prefixedProps = _(cssProperties).map(function(prop){
            return prop + '-similarity';
        });
        this._resetCalculatedSimilarities();

        //TODO: only calculate similarity for requested properties
        this.each(function(snapshot){
            snapshot.calculateSimilarityToPrevious(cssProperties);
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

        var changeCandidates;

        if (method === "stddev") {
            var avgPropsSimilarities = this.map(getPropSimilarityBySnapshot);

            avgPropsSimilarities = _.compact(avgPropsSimilarities);
            var avgSimilarities = jStat.mean(avgPropsSimilarities);
            var stdDevSimilarities = jStat.stdev(avgPropsSimilarities, true);
            changeCandidates = this.filter(function(snapshot){
                var snapshotSimilarity =  getPropSimilarityBySnapshot(snapshot);
                snapshot.set('_is1Sigma', snapshotSimilarity < (avgSimilarities - stdDevSimilarities));
                snapshot.set('_is2Sigma', snapshotSimilarity < (avgSimilarities - 2*stdDevSimilarities));
                return _.isNumber(snapshotSimilarity) && (snapshotSimilarity < (avgSimilarities - stdDevSimilarities));
            });
        }
        else {
            changeCandidates = this.filter(function(snapshot){
                var snapshotSimilarity =  getPropSimilarityBySnapshot(snapshot);
                return _.isNumber(snapshotSimilarity) && (snapshotSimilarity <= threshold);
            });
        }

        return new Snapshots(changeCandidates);
    },

});