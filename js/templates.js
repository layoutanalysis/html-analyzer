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

 var resultTableTemplate =   `
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
    `;


var configFormTemplate = `
  <form>
        <div class="form-group row">
            <label for="medium" class="col-sm-2 col-form-label">Medium</label>
            <div class="col-sm-3">
                <select name="medium" class="form-control form-control-sm">
                    {{#media}}
                        <option value="{{jsonFile}}">{{name}}</option>
                    {{/media}}
                </select>
            </div>
        </div>

        <div class="form-group row">
            <label class="col-sm-2 col-form-label">CSS Properties</label>
                <div class="col-sm-3">
                <select id="properties" class="form-control form-control-sm" size="10" multiple="true">
                    {{#cssProperties}}
                    <optgroup label="{{group}}">
                     {{#properties}}
                        <option value="{{.}}">{{.}}</option>
                     {{/properties}}
                    </optgroup>
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