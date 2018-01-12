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
    calculateSimilarityToPrevious: function(){
        var ownCssAttributes = _(this.getCSSProperties()).keys();
        var previous = this.getPreviousSnapshot();

        var self = this;
        var similarities = [];

        if (previous){
            var previousCssAttributes = _(previous.getCSSProperties()).keys();
            var unifiedAttributes = _.union(ownCssAttributes, previousCssAttributes);
            _(unifiedAttributes).each(function(attr){
                var previousValue = previous.get(attr) || [];
                var ownValue = self.get(attr) || [];
                var similarity = self.getJaccardSimilarity(previousValue, ownValue);
                self.set(attr + '-similarity', similarity);
                similarities.push(similarity);

                self.set(attr + '-added-values', _.difference(ownValue, previousValue));
                self.set(attr + '-common-values', _.intersection(ownValue, previousValue));
                self.set(attr + '-removed-values', _.difference(previousValue, ownValue));
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
    dissimilarInProperties: function (cssProperties){
        var prefixedProps = _(cssProperties).map(function(prop){
            return prop + '-similarity';
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

var configFormTemplate = `
  <form>
        <div class="form-group row">
            <label for="medium" class="col-sm-2 col-form-label">Medium</label>
            <div class="col-sm-3">
                <select name="medium" class="form-control form-control-sm">
                    <option>Clarin</option>
                </select>
            </div>
        </div>

        <div class="form-group row">
            <label class="col-sm-2 col-form-label">CSS Properties</label>
                <div class="col-sm-3">
                <select id="properties" class="form-control form-control-sm" size="10" multiple="true">
                    {{#cssProperties}}
                    <option value="{{.}}">{{.}}</option>
                    {{/cssProperties}}
                </select>
            </div>
        </div>

    <div class="form-group row">
        <label class="col-sm-2 col-form-label" title="To be identified as a change candidate, a snapshot must be more dissimilar than 82% of the other snapshots">Similarity Threshold</label>
        <div class="form-check form-check-inline">
            <input class="form-check-input" type="number" id="similarity-threshold" value="82">%
        </div>
    </div>

    <button type="button" class="btn btn-primary">Analyze</button>
    <button type="button" class="btn btn-secondary">Reset</button>
    <div style="width:1000px;">
        <canvas id="canvas"></canvas>
    </div>
</form>
`;


var cssValueTemplates = {
'base' : `
    <div class="css-property-values {{cssProperty}}-values">
    {{>cssValuesTemplate}}
     </div>
`,
'color': `
     {{#cssValues}}
        <div title="{{.}}" style="width: 20px; height: 20px; margin-right: 5px; float:left; background-color: {{.}}"></div>
    {{/cssValues}}
    <br style="clear:both;">
`,
    'fontFamily': `
      {{#cssValues}}
            <span style="font-family: {{.}}; font-size: 16px;">{{.}}</span><br />
      {{/cssValues}}
`,
    'dimension': `
      <div style="width: 100%, height: 20px; border-bottom: 1px solid black;">
      {{#cssValues}}
            <div style="position: absolute;margin-left: {{.}}; width:1px; height:10px; background-color: red;" title="{{.}}">&nbsp;</div>
      {{/cssValues}}
      </div>
      <br />
      <p>
      {{#cssValues}}
           <span><small>{{.}}</small></span>
      {{/cssValues}}
      </p>
`,
'default': `
      {{#cssValues}}
            <span>{{.}}</span>
      {{/cssValues}}
`}


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
    template: _.template(`
        <br/><br/>
        <h2>Results for <%= medium %></h2>
        <p>Analyzed CSS Properties:
            <% print (analyzedProperties.join(", ")); %>
        </p>
         <h4>
            <% print (snapshots.length); %> Change Candidates detected
        </h4>
        <div class="card-columns" style="column-count:1;">
         <% _.each(snapshots, function(changeSnapshot){ %>
             <div class="card">
              <h5 class="card-header"><% print(changeSnapshot.get("snapshotDate")); %>
              <small class="text-muted" title="Average Similarity to Previous Snapshot"> Similarity: <% print((changeSnapshot.get("avg-similarity")*100).toFixed(2)); %> %</small>
              <small class="text-muted"><a href="<% print(changeSnapshot.getPreviousSnapshot().get("url")); %>" target="_blank">Previous</a> | <a href="<% print(changeSnapshot.get("url")); %>" target="_blank">This</a> | <a href="<% print(changeSnapshot.getNextSnapshot().get("url")); %>" target="_blank">Next Snapshot</a></small>
              </h5>
              <div class="card-body" style="display:none;">
                 <% _.each(analyzedProperties, function(prop){ %>
                    <div class="card">
                        <% var propSimilarity = changeSnapshot.get(prop + "-similarity"); %>
                        <% //if (propSimilarity){ %>
                            <h6 class="card-header"><% print(prop); %> <span class="text-muted font-weight-normal">Similarity: <% print ((propSimilarity*100).toFixed(2)); %></span></h6>
                            <div class="card-body" style="display:none;">
                            
                                <% var addedPropValues = changeSnapshot.getValuesForProperty(prop, "added"); %>
                                <% if (addedPropValues.length > 0){ %>
                                    <p style="color: green;"><% print(addedPropValues.length); %> new values:
                                        <div>                    
                                            <% print (changeSnapshot.formatPropertyValue(prop, addedPropValues)); %>
                                         <br style="clear:both;"/>
                                         </div>
                                    </p>
                                <% } %>
                                
                                 <% var commonPropValues = changeSnapshot.getValuesForProperty(prop, "common"); %>
                                <% if (commonPropValues.length > 0){ %>
                                    <p style="color: black;"><% print(commonPropValues.length); %> common values in both snapshots:
                                        <div>                    
                                            <% print (changeSnapshot.formatPropertyValue(prop, commonPropValues)); %>
                                         <br style="clear:both;"/>
                                         </div>
                                    </p>
                                <% } %>
                                
                                <% var removedPropValues = changeSnapshot.getValuesForProperty(prop, "removed"); %>
                                <% if (removedPropValues.length > 0){ %>
                                    <p style="color: red;"><% print(removedPropValues.length); %> removed values:</p>
                                        <div>
                                         <% print (changeSnapshot.formatPropertyValue(prop, removedPropValues)); %>
                                         <br style="clear:both;"/>
                                        </div>
                                    </p>
                                <% } %>
                                
                            </div>
                        <% //} %>
                    </div>
                 <% }); %>
              </div>
            </div>
        <% }); %>
        </div>
    `),
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
   document.getElementById('config-form').innerHTML = Mustache.to_html(configFormTemplate, {cssProperties: snapshots.getUsedCSSProperties()});
   $('.btn-primary').click(function(e){
       $('#results').empty();
       var analyzedProperties = $('#properties').val();
           //['font-family', 'color','width', 'height','margin-left','margin-right','background-color'];
       var changeCandidates =  snapshots.dissimilarInProperties(analyzedProperties);

        var snapshotDates = snapshots.pluck("snapshotDate").slice(1);
        var datasets = analyzedProperties.map(function(prop){
            return {data: snapshots.pluck(prop + '-similarity').slice(1), label: prop + "-similarity"}
        });
        showSimilarityChart(snapshotDates, datasets);
        resultTable = new ResultTable({snapshots: changeCandidates, analyzedProperties: analyzedProperties, medium: 'Clarin.com'});
        $("#results").append(resultTable.render().el);
       e.preventDefault();
   });
});
clarinSnapshots.fetch();