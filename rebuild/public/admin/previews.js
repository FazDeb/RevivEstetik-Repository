(function () {
  const {CMS, h, createClass} = window;
  CMS.registerPreviewStyle('/admin/site-preview.css');
  function image(props, path, alt) {
    if (!path) return null;
    const asset = props.getAsset(path);
    return h('img', {src:asset ? asset.toString() : path, alt:alt || ''});
  }
  CMS.registerPreviewTemplate('treatments', createClass({
    render() {
      const props=this.props;
      return h('article',{className:'original-treatment'},props.widgetsFor('sections').map((section,index)=>{
        const heading=section.getIn(['data','heading']);
        const paths=section.getIn(['data','images']);
        return h('section',{key:index},h(index===0?'h1':'h2',{},heading),
          h('div',{className:'treatment-row'},
            paths && paths.size ? h('div',{className:'section-images'},paths.map(path=>image(props,path,heading)).toArray()) : null,
            h('div',{className:'treatment-copy'},section.getIn(['widgets','body']))));
      }));
    }
  }));
  CMS.registerPreviewTemplate('home', createClass({
    render(){const p=this.props,d=p.entry.get('data');return h('section',{className:'home-intro wrap'},image(p,d.get('homeImage'),'RevivEstetik'),h('h1',{},d.get('tagline')),h('p',{},d.get('intro')),h('div',{className:'actions'},h('span',{className:'button'},'Our services'),h('span',{className:'button secondary'},'Contact us')));}
  }));
  CMS.registerPreviewTemplate('about', createClass({
    render(){const p=this.props;return h('article',{className:'about-page'},h('h1',{},'About RevivEstetik'),h('div',{className:'about-copy'},p.widgetsFor('aboutSections').map((section,i)=>{const paths=section.getIn(['data','images']);const paragraphs=section.getIn(['data','paragraphs']);return h('section',{key:i},h('h2',{},section.getIn(['data','heading'])),paths&&h('div',{className:'section-images'},paths.map(path=>image(p,path,'')).toArray()),paragraphs&&paragraphs.map((text,j)=>h('p',{key:j},text)).toArray());})));}
  }));
  CMS.init({config: window.REVIVESTETIK_CMS_CONFIG});
})();
