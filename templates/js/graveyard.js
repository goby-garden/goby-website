    d3.select('#arena-goby')
      .append('div')
      .attr('class',"form-section type-"+sData.type)
      .attr('id','section-'+i);
  
    
    let svg=`<svg class="inline form-edit" width="24" height="22"><use href="#${sData.type}-icon"></svg>`;
    
    let newSection=d3.select('#section-'+i);
    newSection.append('label')
      .text(sData.key+":")
      .node()
      .insertAdjacentHTML('afterbegin',svg);

    
    switch(sData.type){
      case "array":
        sData.values.forEach((tag,t)=>{
          newSection.append('div').attr('class','tag').node().dataset.tag=t;
          let newTag=newSection.select(`[data-tag="${t}"]`);
          newTag.append('input').attr('type','checkbox');
          newTag.append('p').text(tag);
          if(gobyBlock[sData.key].find(a=>a==tag)!==undefined){
            newTag.select('input').property('checked',true);
          }
        })
        newSection.append('div').attr('class','add-new-tag form-edit')
        .append('input').attr('class','new-tag-input').attr('type','text').attr('data-fieldname',sData.key).attr('data-index',i).attr('tabindex',i+2);
          
        newSection.select('.add-new-tag')
        .append('button').attr('class','plus-button').attr('type','button').html('+').on('click',function(){
          let newString=d3.select(d3.event.target.parentNode).select('input').property('value');
          generateTag(newString,d3.select(d3.event.target.parentNode).select('input').node())
        });
        
      //<div class="tag" id="tag-lifestyle"><input type="checkbox" data-tag="lifestyle"><p>lifestyle</p></div>
      break;
      case "url":
        newSection.select('label').classed('form-edit',true);
        newSection.append('input').attr('class','form-edit').attr('type','text')
          .property('value',gobyBlock[sData.key])
          .attr('tabindex',i+2);
        newSection.append('a').attr('target','_blank').attr('class','form-display').text(sData.key).attr('href',gobyBlock[sData.key])
        .node()
        .insertAdjacentHTML('afterbegin',svg);
      break;
      case "string":
        newSection.append('input').attr('type','text').attr('class','form-edit')
          .property('value',gobyBlock[sData.key])
          .attr('tabindex',i+2);
        newSection.append('p').attr('class','form-display short-text').text(gobyBlock[sData.key]);
      break;
      case "par":
        newSection.append('textarea')
          .attr('class','form-edit')
          .html(gobyBlock[sData.key])
          .attr('tabindex',i+2);
        newSection.append('p').attr('class','form-display long-text').text(marked(gobyBlock[sData.key]));
      break;
        
    }



    