/* Pedidos de la bolsa: Instagram. Clubes y Talleres conserva su enlace propio. */
(() => {
  'use strict';
  const dialog=$('#instagramCheckoutDialog');
  const summary=$('#instagramOrderSummary'),status=$('#instagramCheckoutStatus');
  const openButton=$('#instagramOpen'),copyButton=$('#instagramCopy');
  const profileLink=$('#instagramProfileFallback');
  let busy=false,copied=false,signature='',orderText='',opened=false,sent=false,instagramWindow=null,lastProfileOpen=0;
  const present=value=>value!==null&&value!==undefined&&String(value).trim()!==''&&!['No aplica','undefined','null'].includes(String(value));

  function profileURL(){
    // Reuse the configured social link; never maintain a second account setting.
    const link=document.querySelector('a[href^="https://www.instagram.com/"]');
    if(!link)throw new Error('No está configurado el Instagram de ThunderCars.');
    const url=new URL(link.href);
    if(!['www.instagram.com','instagram.com'].includes(url.hostname)||!/^\/[A-Za-z0-9._]+\/?$/.test(url.pathname))throw new Error('Revisa el enlace de Instagram configurado.');
    return url;
  }

  function describeOrderItem(item,index,normalPrice=false){
      const product=products.find(p=>p.id===item.id);
      if(!product)throw new Error('Un producto de la bolsa necesita revisión. Tu bolsa se conserva.');
      const accessory=isAccessory(product),baby=isBaby(product);
      const result=[`${index===null?'':index+1+'. '}${product.name}`];
      if(present(product.code))result.push('Código: '+product.code);
      if(product.motorcycle){
        const design=product.motorcycle.style||[product.motorcycle.brand,product.motorcycle.model].filter(present).join(' ');
        if(design)result.push('Diseño: '+design);
      }
      result.push((accessory?'Tipo: ':'Prenda: ')+(accessory?accessoryType(product):product.explicitAgeClassification?item.garment:garmentText(item)));
      if(product.explicitAgeClassification)result.push('Colección: '+product.brand,'Categoría: '+item.classification);
      if(!accessory&&present(item.size))result.push('Talla: '+(baby?item.size:sizeText(item)));
      if(present(item.color)&&(!accessory||product.colors?.length))result.push('Color: '+item.color);
      if(!accessory&&!baby&&product.frontSelection!==false&&present(item.front))result.push('Logo frontal: '+item.front);
      if(accessory)result.push('Detalles: '+accessoryDetails(product,item.color));
      if(present(item.customText))result.push('Personalización: '+item.customText);
      result.push('Cantidad: '+item.qty,(normalPrice?'Precio normal unitario: ':product.explicitAgeClassification?'Precio unitario: ':'Precio: ')+money(unitPrice(item))+' por unidad',(normalPrice?'Subtotal normal: ':product.explicitAgeClassification?'Subtotal: ':'Subtotal producto: ')+money(unitPrice(item)*item.qty));
      return result.join('\n');
  }

  function buildOrderSummary(){
    if(!cart.length)return '';
    const pricing=calculateCartTotals();
    const promotions=pricing.promotions.map(promo=>{
      const pairs=promo.pairs.map((pair,index)=>
        (promo.pairs.length>1?'Combinación '+(index+1)+' · '+pair.quantity+' promociones\n':'')+
        'Polera:\n'+describeOrderItem({...pair.shirt.item,qty:pair.quantity},null,true)+
        '\n\nPolerón:\n'+describeOrderItem({...pair.hoodie.item,qty:pair.quantity},null,true)
      ).join('\n\n');
      return 'PROMO POLERA + POLERÓN '+promo.label+' — '+money(promo.unit)+'\n\n'+pairs+
        '\n\nCantidad de promociones: '+promo.quantity+'\nPrecio normal: '+money(promo.normal)+
        '\nDescuento aplicado: −'+money(promo.discount)+'\nSubtotal promoción: '+money(promo.total);
    });
    const ordinary=pricing.leftovers.map((line,index)=>describeOrderItem({...line.item,qty:line.quantity},index));
    const lines=[...promotions,...(promotions.length&&ordinary.length?['PRODUCTOS FUERA DE LA PROMOCIÓN']:[]),...ordinary];
    const total=pricing.total;
    const breakdown=promotions.length?'Precio normal de productos: '+money(pricing.normalTotal)+'\nDescuento promoción: −'+money(pricing.discount)+'\nSubtotal promociones: '+money(pricing.promotionSubtotal)+'\nProductos fuera de promoción: '+money(pricing.nonPromotionSubtotal)+'\n':'';
    return 'Hola, ThunderCars 👋\nQuiero realizar el siguiente pedido:\n\n'+lines.join('\n\n')+
      '\n\n'+breakdown+'Subtotal: '+money(total)+'\nEnvío: pendiente de confirmar\nTotal actual: '+money(total)+
      '\n\nNombre:\nComuna:\nTipo de entrega: envío / retiro\n\nQuedo atento/a a la confirmación de disponibilidad y pago. 🏁';
  }

  function readyToOpen(value){
    copied=value;openButton.disabled=!value;
    profileLink.setAttribute('aria-disabled',String(!value));
    $('#instagramManualCopy').hidden=value;
  }

  function refreshOrder(){
    const next=JSON.stringify(cart);
    if(next===signature&&orderText)return false;
    orderText=buildOrderSummary();signature=next;summary.value=orderText;
    readyToOpen(false);opened=false;sent=false;
    $('#instagramFollowup').hidden=true;$('#instagramClearOffer').hidden=true;
    return true;
  }

  function selectSummary(){
    summary.focus();summary.select();summary.setSelectionRange(0,summary.value.length);
  }

  async function writeClipboard(text){
    if(navigator.clipboard?.writeText){
      try{await navigator.clipboard.writeText(text);return true}catch{}
    }
    // Compatibility path for local previews and browsers without Clipboard API.
    try{selectSummary();return document.execCommand?.('copy')===true}catch{return false}
  }

  async function copyOrder(){
    if(busy)return false;
    refreshOrder();
    if(!orderText){status.textContent='Tu bolsa está vacía. Agrega un producto para continuar.';readyToOpen(false);return false}
    busy=true;readyToOpen(false);copyButton.disabled=true;
    const checkout=$('#checkoutInstagramButton');if(checkout)checkout.disabled=true;
    copyButton.textContent='COPIANDO…';status.textContent='Preparando el resumen de tu pedido…';
    const currentSignature=signature;
    try{
      const success=await writeClipboard(orderText);
      if(JSON.stringify(cart)!==currentSignature){
        refreshOrder();status.textContent='La bolsa cambió. Copia nuevamente el resumen actualizado.';return false;
      }
      readyToOpen(success);
      status.textContent=success?'¡Tu pedido está listo! Copiamos el resumen para que lo pegues en nuestro chat de Instagram y podamos confirmar stock, confección y envío.':'Tu pedido está listo, pero el navegador no permitió copiarlo. Pulsa «Copiar pedido» o selecciona el resumen y cópialo manualmente.';
      return success;
    }catch{
      readyToOpen(false);status.textContent='No pudimos copiar el pedido. Selecciona el resumen y cópialo manualmente. Tu bolsa se conserva.';return false;
    }finally{
      busy=false;copyButton.disabled=false;copyButton.textContent=copied?'COPIAR PEDIDO NUEVAMENTE':'COPIAR PEDIDO';
      if(checkout)checkout.disabled=false;
    }
  }

  async function checkoutInstagram(){
    if(busy)return;
    if(!cart.length){toast('Agrega un producto a tu bolsa para continuar.');return}
    try{
      const profile=profileURL();profileLink.href=profile.href;
      refreshOrder();
      if(!dialog.open)dialog.showModal();
      await copyOrder();
    }catch(error){toast(error.message||'No pudimos preparar el pedido. Tu bolsa se conserva.')}
  }

  function canOpen(){
    if(refreshOrder())status.textContent='La bolsa cambió. Copia nuevamente el resumen antes de abrir Instagram.';
    if(!copied||busy)return false;
    return true;
  }

  function openInstagram(){
    if(!canOpen())return;
    try{
      const profile=profileURL(),username=profile.pathname.split('/').filter(Boolean)[0];
      const mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
      const destination=mobile?'https://ig.me/m/'+encodeURIComponent(username):profile.href;
      if(instagramWindow&&!instagramWindow.closed){instagramWindow.focus()}
      else{
        instagramWindow=window.open(destination,'thundercars-instagram-pedido');
        if(instagramWindow)instagramWindow.opener=null;
      }
      opened=true;
      $('#instagramOpenHelp').textContent=instagramWindow?'Si no se abre el chat, utiliza «Abrir perfil de Instagram» y pulsa Mensaje. Si Instagram solicita iniciar sesión, vuelve aquí para copiar tu pedido cuando lo necesites.':'El navegador puede haber bloqueado la pestaña. Usa «Abrir perfil de Instagram». Tu resumen y tu bolsa siguen disponibles aquí.';
    }catch{
      $('#instagramOpenHelp').textContent='No pudimos abrir el chat. Usa «Abrir perfil de Instagram» y pulsa Mensaje. Tu bolsa se conserva.';
    }
  }

  openButton.onclick=openInstagram;
  profileLink.onclick=e=>{
    if(!canOpen()){e.preventDefault();return}
    // A real link also works when script-created popups are blocked.
    if(instagramWindow&&!instagramWindow.closed){
      try{instagramWindow.location.href=profileURL().href;instagramWindow.focus();e.preventDefault()}catch{instagramWindow=null}
    }else{
      const now=Date.now();if(now-lastProfileOpen<1500){e.preventDefault();return}lastProfileOpen=now;
    }
    opened=true;
  };
  copyButton.onclick=copyOrder;
  $('#instagramSelectSummary').onclick=selectSummary;
  $('#instagramManualConfirmed').onclick=()=>{
    if(busy||refreshOrder())return;
    readyToOpen(true);copyButton.textContent='COPIAR PEDIDO NUEVAMENTE';
    status.textContent='Pedido preparado. Abre Instagram y pega el resumen que copiaste manualmente.';
  };
  $('#instagramNotSent').onclick=()=>{sent=false;$('#instagramClearOffer').hidden=true;return copyOrder()};
  $('#instagramSent').onclick=()=>{if(!opened||!canOpen())return;sent=true;$('#instagramClearOffer').hidden=false};
  $('#instagramClearCart').onclick=()=>{
    if(!sent||JSON.stringify(cart)!==signature)return;
    cart=[];save();orderText='';signature='';readyToOpen(false);dialog.close();toast('Bolsa vaciada. Gracias por tu pedido.');
  };
  const returning=()=>{if(opened&&dialog.open&&document.visibilityState!=='hidden')$('#instagramFollowup').hidden=false};
  window.addEventListener('focus',returning);document.addEventListener('visibilitychange',returning);
  dialog.addEventListener('close',()=>{const button=$('#checkoutInstagramButton')||$('#cartOpen');button?.focus({preventScroll:true})});
  try{const profile=profileURL().href;document.querySelectorAll('[data-instagram-inquiry],#accessoryInquiry').forEach(link=>link.href=profile)}catch{}
  window.tcCheckout={channel:'instagram',checkoutInstagram,buildOrderSummary};
})();
