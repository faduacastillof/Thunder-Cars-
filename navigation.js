/* Vistas compartidas: una fuente de productos y una sola bolsa. Sin recargas. */
(() => {
  'use strict';
  const categories = [
    {key:'poleras',value:'Polera',name:'Poleras'},
    {key:'polerones',value:'Polerón',name:'Polerones'},
    {key:'bebidas',value:'Bebidas',name:'Tazas y botellas'},
    {key:'cuadros',value:'Cuadro',name:'Cuadros',cover:'assets/category-covers/cuadros-habitacion-skyline.png',coverAlt:'Cuadro Nissan Skyline instalado en la pared de una habitación'},
    {key:'llaveros',value:'Accesorios',name:'Lanyards y llaveros',cover:'assets/category-covers/lanyards-y-llaveros.png',coverAlt:'Lanyard NOS con llavero turbo y llave sobre un pantalón cargo'},
    {key:'cubrepatentes',value:'Cubrepatente',name:'Cubrepatentes'}
  ];
  const views = ['home','catalogo','marcas','thunderbaby','thunderbike'];
  const slug = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const visibleProducts = () => products.filter(p=>!p.isLogo);
  let ready=false, activeParams=new URLSearchParams(), lastHash='', routeVersion=0;
  const routeForBrand = value => '#/catalogo?marca='+slug(value);
  function parseRoute(hash) {
    const legacy={catalogo:'#/catalogo',familia:'#/?seccion=familia',favoritos:'#/?seccion=favoritos',marca:'#/?seccion=marca',talleres:'#/?seccion=talleres',comunidad:'#/?seccion=comunidad',home:'#/'};
    let value=hash.replace(/^#/,'');
    if(legacy[value])value=legacy[value].slice(1);
    if(!value)value='/';
    const [path,search='']=value.split('?');
    const view=path==='/'||path==='/home'?'home':path.replace(/^\//,'').replace(/\/$/,'');
    return {view:views.includes(view)?view:'home',params:new URLSearchParams(search)};
  }
  function navigate(hash) {
    if(location.hash===hash)applyRoute(true);else location.hash=hash;
  }
  function repairLinks() {
    // A base URL is used by the portable preview for assets, not navigation.
    document.querySelectorAll('a[href^="#"]').forEach(a=>a.href=location.href.split('#')[0]+a.getAttribute('href'));
  }
  function selectCategory(value) {
    if(value==='Baby'){navigate('#/thunderbaby');return}
    const entry=categories.find(c=>c.value===value);
    const params=new URLSearchParams(activeParams);
    if(entry&&!['Polera','Polerón'].includes(entry.value))params.delete('marca');
    if(currentView!=='thunderbike')params.delete('buscar');params.delete('destacados');params.delete('todos');
    if(entry)params.set('tipo',entry.key);else{params.delete('tipo');params.set('todos','1')}
    navigate('#/'+(currentView==='thunderbike'?'thunderbike':'catalogo')+'?'+params);
  }
  function updateParam(key,value,replace=false) {
    const params=new URLSearchParams(activeParams);
    if(value)params.set(key,value);else params.delete(key);
    if(currentView==='catalogo'&&!params.has('tipo')&&!params.has('marca')&&!params.has('destacados'))params.set('todos','1');
    const hash='#/'+currentView+(params.size?'?'+params:'');
    if(replace){history.replaceState(null,'',hash);applyRoute(false)}else navigate(hash);
  }
  function buildLanding() {
    const all=visibleProducts().filter(p=>!isBaby(p));
    $('#categoryCards').innerHTML=categories.map(c=>{
      const list=all.filter(p=>matchesProductCategory(p,c.value));
      const preferred=c.value==='Polerón'?all.find(p=>p.hoodieImage):c.value==='Polera'?all.find(p=>p.id==='toyota-2-5-SUP-006'):null;
      const p=preferred||list[0];
      const src=c.cover||(p?imageFor(p,c.value==='Polerón'?'Polerón':garmentFor(p)):'');
      return `<a class="category-card" href="${c.route||'#/catalogo?tipo='+c.key}">${src?`<img${c.cover?` class="category-cover cover-${c.key}"`:''} src="${escapeHtml(src)}" alt="${escapeHtml(c.coverAlt||c.name)}" loading="lazy">`:''}<div><h2>${c.name}</h2><span>${list.length} diseños ↗</span></div></a>`;
    }).join('');
    $('#brandMenu').innerHTML=automotiveBrands().map(b=>{
      const count=all.filter(p=>p.brand===b&&!isAccessory(p)&&!isBaby(p)).length;
      return `<a class="garage-card" data-garage-brand="${escapeHtml(b)}" href="${routeForBrand(b)}"><h2>${escapeHtml(brandLabel(b))}</h2><span>${count} diseños ↗</span></a>`;
    }).join('');
    document.querySelectorAll('[data-feature-id]').forEach(b=>featuredProductIds.add(b.dataset.featureId));
    document.querySelectorAll('[data-feature]').forEach(b=>{const p=all.find(p=>p.brand==='Rápidos y Furiosos'&&p.name===b.dataset.feature);if(p)featuredProductIds.add(p.id)});
    repairLinks();
  }
  function syncBrandBar() {
    const bike=currentView==='thunderbike',bar=$('#brandFilters'),available=availableBikeBrands(),scope=bike?'bike:'+available.join('|'):'automotive';
    const primary=['Choppers','Honda','Kawasaki','Yamaha','Ducati','BMW','KTM','Suzuki','Harley-Davidson'];
    const button=value=>`<button type="button" data-bike-brand="${escapeHtml(value)}" aria-pressed="false">${value==='Choppers'?'<span>CHOPPERS</span><span class="bike-bestseller"><span aria-hidden="true">🔥</span> MÁS VENDIDO</span>':escapeHtml(value==='Todo'?'Todas':value)}</button>`;
    if(bar.getAttribute('data-filter-scope')!==scope||(bike&&!$('#bikeMoreOpen'))){
      if(bike){
        const more=available.filter(b=>!primary.includes(b));
        bar.innerHTML=['Todo',...primary.filter(b=>available.includes(b))].map(button).join('')+`<button type="button" id="bikeMoreOpen" aria-haspopup="dialog" aria-controls="bikeMoreDialog" aria-expanded="false"${more.length?'':' hidden'}>Más marcas ▾</button>`;
        $('#bikeMoreOptions').innerHTML=more.map(button).join('');
      }else{buildBrands();$('#bikeMoreOptions').innerHTML=''}
      bar.setAttribute('data-filter-scope',scope);
    }
    bar.setAttribute('aria-label',bike?'Filtrar ThunderBike por marca o estilo':'Catálogos por marca');
    if(bike){
      document.querySelectorAll('[data-bike-brand]').forEach(button=>{
        const active=button.dataset.bikeBrand===bikeBrand;
        button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
      });
      const secondary=bikeBrand!=='Todo'&&!primary.includes(bikeBrand),more=$('#bikeMoreOpen');
      more.textContent=secondary?'Más marcas: '+bikeBrand+' ▾':'Más marcas ▾';
      more.classList.toggle('active',secondary);
      const kind=category==='Polera'?'poleras':category==='Polerón'?'polerones':'diseños';
      $('#resultsCount').textContent=filtered().length+' '+kind+' / '+(bikeBrand==='Todo'?'ThunderBike':bikeBrand)+(query?' · Búsqueda: '+$('#search').value.trim():'');
      $('#empty').textContent='No encontramos diseños con esa búsqueda. Prueba con otra marca, modelo o código.';
    }
    $('#bikeBrandHeading').hidden=!bike;$('#bikeSearchHelp').hidden=!bike;
    $('#bikeClearSearch').hidden=!bike||!$('#search').value;
    if(bike)$('#search').setAttribute('aria-describedby','bikeSearchHelp');else $('#search').removeAttribute('aria-describedby');
    $('#search').setAttribute('placeholder',bike?'Buscar marca, modelo o código…':'Buscar un diseño');
    $('#search').setAttribute('aria-label',bike?'Buscar marca, modelo, diseño o código ThunderBike':'Buscar un diseño');
  }
  function afterRender() {
    const selected=categories.find(c=>c.value===category);
    const title=currentView==='thunderbaby'?'LOS PEQUEÑOS DEL GARAGE.':currentView==='thunderbike'?'DISEÑOS THUNDERBIKE.':onlyBestsellers?'LOS MÁS VENDIDOS.':brand!=='Todo'?brandLabel(brand).toLocaleUpperCase('es')+'.':selected?selected.name.toLocaleUpperCase('es')+'.':'TODOS LOS PRODUCTOS.';
    $('#catalogo .section-top h2').textContent=title;
    $('#catalogo .section-top .eyebrow').textContent=currentView==='catalogo'?'EL CATÁLOGO / '+(brand!=='Todo'?'TU GARAGE':'ELIGE TU DISEÑO'):'EL UNIVERSO THUNDER';
    $('#catalogo .section-top p').textContent=currentView==='thunderbaby'?'Bodies y poleritas talla 2.':'Tu pasión. Tu diseño. Tu estilo.';
    $('#catalogo').classList.toggle('baby-mode',currentView==='thunderbaby');
    $('#backToCategories').hidden=currentView!=='catalogo';
    document.querySelector('.catalog-breadcrumb a:last-child').hidden=currentView!=='catalogo';
    syncBrandBar();
    $('#brandFilters').hidden=currentView!=='thunderbike'&&(currentView!=='catalogo'||!['Todo','Polera','Polerón'].includes(category));
    document.querySelectorAll('#brandFilters [data-brand]').forEach(b=>{
      b.classList.toggle('active',b.dataset.brand===brand);
      b.setAttribute('aria-pressed',String(b.dataset.brand===brand));
    });
    repairLinks();
  }
  function applyRoute(scroll=true) {
    if(!ready)return;
    const previousView=currentView;
    const route=parseRoute(location.hash),params=route.params;
    if(route.view==='catalogo'&&params.get('tipo')==='accesorios'){
      params.delete('tipo');params.set('marca',slug(accessoriesCatalog));
      history.replaceState(null,'','#/catalogo?'+params);
    }
    if(route.view==='catalogo'&&params.get('tipo')==='thunderbaby'){
      route.view='thunderbaby';params.delete('tipo');
      history.replaceState(null,'','#/thunderbaby'+(params.size?'?'+params:''));
    }
    currentView=route.view;activeParams=params;
    if($('#bikeMoreDialog').open)$('#bikeMoreDialog').close();
    category=categories.find(c=>c.key===params.get('tipo'))?.value||'Todo';
    brand=automotiveBrands().find(b=>slug(b)===params.get('marca'))||'Todo';
    onlyBestsellers=params.get('destacados')==='1';
    babyType=['body','infantil'].includes(params.get('prenda'))?params.get('prenda'):'Todo';
    if(currentView==='thunderbaby'){category='Baby';brand='Todo';onlyBestsellers=false}
    bikeBrand='Todo';
    if(currentView==='thunderbike'){category=['Polera','Polerón'].includes(category)?category:'Todo';brand='Thunderbike';onlyBestsellers=false;bikeBrand=availableBikeBrands().find(value=>slug(value)===params.get('marca'))||'Todo'}
    query=(params.get('buscar')||'').trim().toLocaleLowerCase('es');
    sort=['name','code'].includes(params.get('orden'))?params.get('orden'):'default';
    limit=24;
    catalogSelectorActive=currentView==='catalogo'&&!params.has('tipo')&&brand==='Todo'&&!onlyBestsellers&&!params.has('todos')&&!query;
    document.querySelectorAll('[data-view]').forEach(el=>el.hidden=el.dataset.view!==currentView||(el.id==='catalogLanding'&&!catalogSelectorActive));
    $('#catalogo').hidden=!['catalogo','thunderbaby','thunderbike'].includes(currentView)||catalogSelectorActive;
    document.body.dataset.currentView=currentView;
    const buttons=currentView==='thunderbaby'?[['Todo','Todos'],['body','Bodies'],['infantil','Poleritas talla 2']]:currentView==='thunderbike'?[['Todo','Todos los diseños'],['Polera','Poleras'],['Polerón','Polerones']]:[['Todo','Todos'],...categories.filter(c=>!c.route).map(c=>[c.value,c.name])];
    $('#filters').innerHTML=buttons.map(([value,label])=>`<button data-cat="${escapeHtml(value)}" class="${value===(currentView==='thunderbaby'?babyType:category)?'active':''}" aria-pressed="${value===(currentView==='thunderbaby'?babyType:category)}">${label}</button>`).join('');
    $('#search').value=params.get('buscar')||'';$('#sort').value=sort;
    render();afterRender();
    document.querySelectorAll('[data-route]').forEach(link=>{const active=link.dataset.route===currentView;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current')});
    document.title=(currentView==='home'?'ThunderCars':({catalogo:'Catálogo',marcas:'El Garage',thunderbaby:'ThunderBaby',thunderbike:'ThunderBike'})[currentView]+' | ThunderCars')+' · Smoke Clothes';
    if(scroll&&!(previousView==='thunderbike'&&currentView==='thunderbike')){
      const version=++routeVersion;
      requestAnimationFrame(()=>{
        if(version!==routeVersion)return;
        const section=params.get('seccion');
        const target=currentView==='home'&&['favoritos','familia','talleres','comunidad','marca'].includes(section)?document.getElementById(section):null;
        if(target){if(target.tagName==='DETAILS')target.open=true;target.scrollIntoView({behavior:'instant',block:'start'})}else window.scrollTo({top:0,behavior:'instant'});
        const heading=currentView==='home'?document.querySelector('.hero h1'):document.querySelector('[data-view]:not([hidden]) h1')||$('#catalogo .section-top h2');
        if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true})}
      });
    }
    lastHash=location.hash;
  }
  window.tcNavigation={navigate,selectCategory,afterRender,parseRoute};
  function selectBikeBrand(e){const b=e.target.closest('[data-bike-brand]');if(!b||currentView!=='thunderbike')return false;updateParam('marca',b.dataset.bikeBrand==='Todo'?'':slug(b.dataset.bikeBrand));return true}
  const moreDialog=$('#bikeMoreDialog');
  $('#brandFilters').onclick=e=>{
    const opener=e.target.closest('#bikeMoreOpen');
    if(opener&&currentView==='thunderbike'){
      moreDialog.showModal();opener.setAttribute('aria-expanded','true');
      const rect=opener.getBoundingClientRect(),width=Math.min(360,window.innerWidth-24),height=Math.min(moreDialog.scrollHeight,window.innerHeight-24);
      moreDialog.style.width=width+'px';
      moreDialog.style.left=Math.max(12,Math.min(rect.right-width,window.innerWidth-width-12))+'px';
      moreDialog.style.top=(rect.bottom+8+height<=window.innerHeight-12?rect.bottom+8:Math.max(12,rect.top-height-8))+'px';
      return;
    }
    if(selectBikeBrand(e))return;
    const b=e.target.closest('[data-brand]');if(!b)return;updateParam('marca',b.dataset.brand==='Todo'?'':slug(b.dataset.brand));
  };
  $('#bikeMoreOptions').onclick=selectBikeBrand;
  moreDialog.addEventListener('close',()=>{const opener=$('#bikeMoreOpen');if(opener){opener.setAttribute('aria-expanded','false');if(currentView==='thunderbike')opener.focus({preventScroll:true})}});
  window.addEventListener('resize',()=>{if(moreDialog.open)moreDialog.close()});
  $('#bikeClearSearch').onclick=e=>{e.preventDefault();updateParam('buscar','',true);$('#search').focus({preventScroll:true})};
  $('#filters').onclick=e=>{const b=e.target.closest('[data-cat]');if(!b)return;if(currentView==='thunderbaby')updateParam('prenda',b.dataset.cat==='Todo'?'':b.dataset.cat);else selectCategory(b.dataset.cat)};
  $('#search').oninput=e=>updateParam('buscar',e.target.value,true);
  $('#sort').onchange=e=>updateParam('orden',e.target.value==='default'?'':e.target.value);
  $('#resetFilters').onclick=()=>navigate(currentView==='catalogo'?'#/catalogo?todos=1':'#/'+currentView);
  $('#garageSearch').oninput=e=>{
    const q=slug(e.target.value);let found=0;
    document.querySelectorAll('[data-garage-brand]').forEach(el=>{el.hidden=!slug(el.dataset.garageBrand).includes(q);if(!el.hidden)found++});
    $('#garageEmpty').hidden=!!found;
  };
  const menu=$('#catalogDialog'),toggle=$('#mobileNavOpen');
  toggle.onclick=()=>{menu.showModal();toggle.setAttribute('aria-expanded','true');document.documentElement.classList.add('navigation-open')};
  menu.addEventListener('close',()=>{toggle.setAttribute('aria-expanded','false');document.documentElement.classList.remove('navigation-open');toggle.focus({preventScroll:true})});
  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href]');if(!a)return;
    const url=new URL(a.href,location.href);
    if(url.origin!==location.origin||url.pathname!==location.pathname||!url.hash)return;
    if(e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
    e.preventDefault();if(menu.open)menu.close();navigate(url.hash);
  });
  document.querySelectorAll('#favoritesPrev,#favoritesNext').forEach(b=>b.onclick=()=>{
    const track=document.querySelector('.favorite-grid');track.scrollBy({left:track.clientWidth*(b.id==='favoritesNext'?1:-1),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  });
  window.addEventListener('hashchange',()=>{if(location.hash!==lastHash)applyRoute(true)});
  function start(){if(ready||!products.length)return;ready=true;buildLanding();applyRoute(true)}
  window.addEventListener('tc:ready',start);start();repairLinks();
})();
