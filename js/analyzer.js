var Snapshot = Backbone.Model.extend({
    initialize: function (attributes, options){
        //this.calculateSimilarityToPrevious();
    },
    getPreviousSnapshot: function (){
        var ownIndex = this.collection.indexOf(this);
        if (ownIndex > 0){
            return this.collection.at(ownIndex - 1);
        }
    },
    calculateSimilarityToPrevious: function(){
        var cssAttributes = _(this.toJSON()).omit('url','snapshotDate');
        var previous = this.getPreviousSnapshot();
        var self = this;
        if (previous){
            _(cssAttributes).each(function(value, key){
                var previousValue = previous.get(key) || [];
                self.set(key + '-similarity', self.getJaccardSimilarity(previousValue, value));
                self.set(key + '-added-values', _.uniq(_.difference(value, previousValue)));
                self.set(key + '-removed-values', _.uniq(_.difference(previousValue, value)));
            });
        }
    },
    getJaccardSimilarity: function (arr1, arr2){
        return (_.intersection(arr1,arr2).length / _.union(arr1, arr2).length);
    },
    formatPropertyValue: function(cssProperty, cssValue){
        if (cssProperty.indexOf('color') > - 1){
            return '<div style="width: 20px; height: 20px; margin-right: 5px; float: left; background-color:' + cssValue + '"></div>';
        }
        return cssValue;
    },
    parse: function (data, options){
        var attributes = {};
        _.extend(attributes,data.declarations.properties);
        attributes['url'] = data['url'];
        attributes['snapshotDate'] = data['snapshot-date'];
        return attributes;
    }
})

var Snapshots = Backbone.Collection.extend({
    model:Snapshot,
    idAttribute: "url",
    comparator: "snapshotDate",
    url:"data/all_css/clarin.cssstats.json",
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
    dissimilarInProperties: function (cssProperties){
        var prefixedProps = _(cssProperties).map(function(prop){
            return prop + '-similarity';
        });

        var getPropSimilarityBySnapshot = function(snapshot){
            var propSims = _(snapshot.toJSON()).pick(prefixedProps);
            propSims = _(propSims).values();
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
    template: _.template([
     '<h2>Results</h2>',
     '<h4>Analyzed Properties: ',
        '<% print (analyzedProperties.join(", ")); %>',
     '</h4>',
     '<table class="table">',
     '<thead>',
        '<tr>',
            '<th>Change Snapshot</th>',
            '<th>Changed Parameters</th>',
        '</tr>',
     '</thead>',
        '<tbody>',
        '<% _.each(snapshots, function(changeSnapshot){ %>',
        '<tr>',
        '<td><% print(changeSnapshot.get("snapshotDate")); %></td>',
        '<td>',
        '<% _.each(analyzedProperties, function(prop){ %>',
            '<h4><% print(prop); %></h4> <p>Similarity: <% print (changeSnapshot.get(prop + "-similarity").toFixed(2)); %><br />',
                '<p>New values:</p>',
               ' <% _.each(changeSnapshot.get(prop + "-added-values"), function (value){ %>',
                    '<% print (changeSnapshot.formatPropertyValue(prop, value)); %>',
                 '<% }); %>',
                ' <br style="clear:both;"/>',
                '<p>Removed values: </p>',
                ' <% _.each(changeSnapshot.get(prop + "-removed-values"), function (value){ %>',
                     '<% print (changeSnapshot.formatPropertyValue(prop, value)); %>',
                '<% }); %>',
            ' </p>',
        '<% }); %>',
        '</td>',
        '</tr>',
        '<% }); %>',
        '</tbody>',
     '</table>'
    ].join('')),
    render: function() {
        this.$el.html(this.template(this.options));
        return this;
    }
});

var clarinSnapshots = new Snapshots();

clarinSnapshots.on("add", function(snapshot){
   snapshot.calculateSimilarityToPrevious();
});

clarinSnapshots.on("sync", function(snapshots){
    //console.log("Dissimilar Snapshots by CSS Property Font Family",collection.dissimilarByProperty('font-family'));
   var analyzedProperties = ['font-family', 'color','width', 'height','margin-left','margin-right'];
   var changeCandidates =  snapshots.dissimilarInProperties(analyzedProperties);
   //var changeDates =  _(changeCandidates).map(function(cc){return cc.get('snapshotDate')});
   //$('body').append('<p>Change candidates: ' + changeDates.join(', ') + '</p>');
    resultTable = new ResultTable({snapshots: changeCandidates, analyzedProperties: analyzedProperties});
    $("body").append(resultTable.render().el);
});
clarinSnapshots.fetch();