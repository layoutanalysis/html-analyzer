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
        <p><% print (snapshots.getAnalyzedProperties().length); %> compared CSS Properties</p>
        <p>
            Total number of CSS Stats Reports in Collection: <%= totalNumberOfSnapshots %>
        </p>
         <h4>
            <span><% print (snapshots.length); %> Change Candidates detected</span> <span style="position:absolute; right:10px; margin-top:-10px;"><button type="button" onClick="downloadCSV();" class="btn btn-primary">CSV Download</button></span>
        </h4>
        <div class="card-columns" style="column-count:1;">
         <% snapshots.each(function(changeSnapshot){ %>
              <% var cardClass = changeSnapshot.get("_is2Sigma") ? 'text-white bg-dark': ''; %>
              <% var changeMessage = changeSnapshot.get("_is2Sigma") ? 'heavy change (at least 45% more different than average)': 'moderate change (at least 34% more different than average)'; %>
             <div class="card <%= cardClass %>">
              <h5 class="card-header" title="<%= changeMessage %>" style="cursor:pointer;"><% print(changeSnapshot.getDateString()); %>
              <small class="text-muted" title="Average Similarity to Previous Snapshot"> Similarity: <% print((changeSnapshot.get("avg-similarity")*100).toFixed(2)); %> %</small>
              <small class="text-muted" style="font-size: 12px;">between the <a href="<% print(changeSnapshot.getPreviousSnapshot().get("url")); %>" target="_blank">previous</a> and <a href="<% print(changeSnapshot.get("url")); %>" target="_blank">this website version</a> </small>
              </h5>
              <div class="card-body" style="display:none;">
                 <% _.each(analyzedProperties, function(prop){ %>
                    <% var propSimilarity = changeSnapshot.get(prop + "-similarity"); %>
                    <% if (propSimilarity < 1){ %>
                        <div class="card <%= cardClass %>">
                            <h6 class="card-header"><% print(prop); %> <span class="text-muted font-weight-normal">Similarity: <% print ((propSimilarity*100).toFixed(2)); %></span></h6>
                            <div class="card-body" style="display:none;">
                                <% var removedPropValues = changeSnapshot.getValuesForProperty(prop, "removed"); %>
                                <% var commonPropValues = changeSnapshot.getValuesForProperty(prop, "common"); %>
                                <% var addedPropValues = changeSnapshot.getValuesForProperty(prop, "added"); %>
                                <% var totalChangeNumber = removedPropValues.length + addedPropValues.length %>

                                <span class="text-muted"><%= totalChangeNumber %> changes in '<%= prop %>' values between the <a href="<% print(changeSnapshot.getPreviousSnapshot().get("url")); %>" target="_blank">previous</a> and <a href="<% print(changeSnapshot.get("url")); %>" target="_blank">this website version:</a></span><br/><br/>

                                <table class="table">
                                <thead>
                                    <td> <span class="removed-values" alt="values that were present in the previous snapshot, but not in the current one"><%= removedPropValues.length %> removed Values</span> </td>
                                    <td><span class="shared-values"><%= commonPropValues.length %> shared values</span></td>
                                    <td><span class="added-values"><%= addedPropValues.length %> added values</span></td>
                                </thead>
                                <tbody>
                                    <td>
                                        
                                        <% if (removedPropValues.length > 0){ %>
                                            <div class="removed-values">
                                                <div>
                                                <% print (changeSnapshot.formatPropertyValue(prop, removedPropValues)); %>
                                                <br style="clear:both;"/>
                                                </div>
                                            </div>
                                        <% } %>
                                   
                                    </td>

                                    <td>
                                        
                                        <% if (commonPropValues.length > 0){ %>
                                                <div class="shared-values">                    
                                                    <% print (changeSnapshot.formatPropertyValue(prop, commonPropValues)); %>
                                                <br style="clear:both;"/>
                                                </div>
                                            </div>
                                        <% } %>
                                    </td>

                                    <td>
                                        
                                        <% if (addedPropValues.length > 0){ %>
                                                <div class="added-values">                    
                                                    <% print (changeSnapshot.formatPropertyValue(prop, addedPropValues)); %>
                                                <br style="clear:both;"/>
                                                </div>
                                            </div>
                                        <% } %>
                                    </td>

                                </tbody>
                                </table>
                               
                                
                                
                                
                                
                                
                            </div>
                        
                    </div>
                 <% } //END IF%>
                <% }); //END ANALYZED PROPERTIES %>
              </div>
            </div>
        <% }); // END SNAPSHOT%>
        </div>
    `;


var configFormTemplate = `
  <form>
        <div class="form-group row">
            <label for="medium" class="col-sm-2 col-form-label">CSS Stats Report Collection</label>
            <div class="col-sm-3">
                <select name="medium" class="form-control form-control-sm">
                    {{#media}}
                        <option value="{{jsonFile}}">{{name}}</option>
                    {{/media}}
                </select>
            </div>
        </div>

        <div class="form-group row">
        <label class="col-sm-2 col-form-label" title="An">Compared CSS Properties</label>
            <div class="col-sm-8 form-check form-check-inline ">
            <table id="css-property-table" class="table table-striped">
            {{#cssProperties}}
            <tr>
                
                <td>
                   <small><b> {{group}}</b></small>
                </td>
                <td>

                {{#properties}}
                    
                    <div class="form-check form-check-inline">
                    <small><label class="form-check-label" for="compare_all_props">
                    {{.}}  
                    <input class="form-check-input" type="checkbox" value="{{.}}" id="{{.}}">
                    </label></small>
                    </div>
                    
                {{/properties}}
                </td>
                
            </tr>
            {{/cssProperties}}
            </table>
        </div>
    </div>
        <div class="form-group row" style="display:none;">
            <label class="col-sm-2 col-form-label" title="An">Compare Values of CSS Properties</label>
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
        <label class="col-sm-2 col-form-label" title=" than 82% of the other snapshots">Similarity Threshold</label>
        <div class="form-check form-check-inline">To be identified as a change candidate, a report must have &nbsp;
            <input class="form-check-input" disabled="disabled" type="number" id="similarity-threshold" min="0" max="50" value="34">% or less similarity &nbsp; 
            <select id="similarity-method">
                <option value="stddev">than the average report</option>
                <option value="absolute">to its previous report</option>
            </select>
        </div>
    </div>
    <div class="form-group row">
        <label class="col-sm-2 col-form-label" title=" than 82% of the other snapshots">Sort Change Candidates by</label>
        <div class="form-check form-check-inline">
        <label><input type="radio" name="sort" value="snapshotDate">Snapshot Date</label> &nbsp;
        <label><input type="radio" name="sort" value="similarity" checked> Similarity (ascending)</label>
        </div>
    </div>

    <button type="button" class="btn btn-primary">Compare</button>
    <button type="button" class="btn btn-secondary">Reset</button>
    <div style="width:1000px;">
        <canvas id="canvas"></canvas>
    </div>
    
</form>
`;