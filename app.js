
/* =========================
   AnorMarket – App Core JS
   ========================= */

;(function(){
  const LS_USERS = "am_users";
  const LS_SESSION = "am_session_user";
  const LS_CART = "am_cart";

  // ---------- Storage helpers ----------
  function loadJSON(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(e){ return fallback; }
  }
  function saveJSON(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

  // ---------- Users & Auth ----------
  function getUsers(){ return loadJSON(LS_USERS, {}); }
  function setUsers(obj){ saveJSON(LS_USERS, obj); }

  function registerUser({name, email, password}){
    email = (email||"").trim().toLowerCase();
    if(!name || !email || !password) throw new Error("Ma'lumotlar to'liq emas");
    if(password.length < 6) throw new Error("Parol kamida 6 belgidan iborat bo‘lsin");

    const users = getUsers();
    if(users[email]) throw new Error("Bu email bilan foydalanuvchi mavjud");

    const passHash = btoa(password); // demo uchun
    users[email] = { name, passHash, createdAt: Date.now() };
    setUsers(users);
    setSession(email);
    return email;
  }

  function loginUser({email, password}){
    email = (email||"").trim().toLowerCase();
    const users = getUsers();
    if(!users[email]) throw new Error("Akkaunt topilmadi");
    if(users[email].passHash !== btoa(password)) throw new Error("Parol noto‘g‘ri");
    setSession(email);
    return email;
  }

  function setSession(email){ localStorage.setItem(LS_SESSION, email); }
  function getSession(){ return localStorage.getItem(LS_SESSION); }
  function clearSession(){ localStorage.removeItem(LS_SESSION); }

  // ---------- Cart ----------
  function getCart(){ return loadJSON(LS_CART, []); }
  function setCart(cart){ saveJSON(LS_CART, cart); updateCartBadge(); }
  function addToCart(item){
    const cart = getCart();
    cart.push(item);
    setCart(cart);
    toast(`${item.title ? item.title + " " : ""}savatga qo‘shildi`);
  }
  function removeFromCart(index){
    const cart = getCart();
    cart.splice(index,1);
    setCart(cart);
  }
  function clearCart(){ setCart([]); }

  // ---------- UI utilities ----------
  function q(sel,root=document){ return root.querySelector(sel); }
  function qa(sel,root=document){ return Array.from(root.querySelectorAll(sel)); }

  function updateAuthUI(){
    const email = getSession();
    const auth = q("#authSection");
    const profile = q("#profileSection");
    const greeting = q("#greeting");
    if(!auth || !profile) return;
    if(email){
      const users = getUsers();
      const name = users[email]?.name || email;
      greeting.textContent = `Profil: ${name}`;
      profile.classList.remove("hidden");
      auth.classList.add("hidden");
    } else {
      profile.classList.add("hidden");
      auth.classList.remove("hidden");
    }
    updateCartBadge();
  }

  function updateCartBadge(){
    const badge = q("#cartCount");
    if(!badge) return;
    const n = getCart().length;
    badge.textContent = n;
    badge.setAttribute("aria-label", `Savatchada ${n} ta mahsulot`);
  }

  function wireHeader(){
    const loginBtn = q("#loginBtn");
    const registerBtn = q("#registerBtn");
    const logoutBtn = q("#logoutBtn");
    const openCartBtn = q("#openCart");

    // modal
    const modal = q("#authModal");
    const tabLogin = q("#tabLogin");
    const tabRegister = q("#tabRegister");
    const loginForm = q("#loginForm");
    const registerForm = q("#registerForm");

    function openModal(which="login"){
      modal?.classList.remove("hidden");
      which==="register" ? showRegister() : showLogin();
    }
    function closeModal(){ modal?.classList.add("hidden"); }
    function showLogin(){
      tabLogin?.classList.add("active");
      tabRegister?.classList.remove("active");
      loginForm?.classList.remove("hidden");
      registerForm?.classList.add("hidden");
    }
    function showRegister(){
      tabRegister?.classList.add("active");
      tabLogin?.classList.remove("active");
      registerForm?.classList.remove("hidden");
      loginForm?.classList.add("hidden");
    }

    loginBtn?.addEventListener("click", ()=> openModal("login"));
    registerBtn?.addEventListener("click", ()=> openModal("register"));
    qa("[data-close]").forEach(el => el.addEventListener("click", closeModal));
    tabLogin?.addEventListener("click", showLogin);
    tabRegister?.addEventListener("click", showRegister);

    loginForm?.addEventListener("submit", (e)=>{
      e.preventDefault();
      const fd = new FormData(loginForm);
      try{
        loginUser({email: fd.get("email"), password: fd.get("password")});
        closeModal();
        updateAuthUI();
        toast("Xush kelibsiz!");
      }catch(err){ alert(err.message); }
    });

    registerForm?.addEventListener("submit", (e)=>{
      e.preventDefault();
      const fd = new FormData(registerForm);
      try{
        registerUser({name: fd.get("name"), email: fd.get("email"), password: fd.get("password")});
        closeModal();
        updateAuthUI();
        toast("Ro‘yxatdan o‘tildi!");
      }catch(err){ alert(err.message); }
    });

    logoutBtn?.addEventListener("click", ()=>{ clearSession(); updateAuthUI(); });

    openCartBtn?.addEventListener("click", ()=>{
      window.location.href = "cart.html";
    });
  }

  // Simple toast
  function toast(msg){
    let el = document.createElement("div");
    el.className = "am-toast";
    el.textContent = msg;
    Object.assign(el.style, {
      position:"fixed", left:"50%", transform:"translateX(-50%)", bottom:"20px",
      background:"#111827", color:"#fff", padding:"10px 14px", borderRadius:"12px",
      fontWeight:"700", zIndex:9999, boxShadow:"0 8px 30px rgba(0,0,0,.2)"
    });
    document.body.appendChild(el);
    setTimeout(()=>{ el.style.opacity="0"; el.style.transition="opacity .4s"; }, 1600);
    setTimeout(()=> el.remove(), 2100);
  }

  // Expose minimal API for product pages
  window.AM = { addToCart, getCart, removeFromCart, clearCart, updateCartBadge };

  // Init on DOM ready
  document.addEventListener("DOMContentLoaded", ()=>{
    wireHeader();
    updateAuthUI();
  });
})();
