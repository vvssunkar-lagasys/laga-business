/**
 * LaGa GST Suite - Core Application Logic
 */
console.log('🏁 app.js file LOADED');

try {
    // --- Configuration ---
    var SUPABASE_URL = 'https://tmhyzjrxmnavbjkdmhjl.supabase.co';
    var SUPABASE_ANON_KEY = 'sb_publishable_NAcZ5VyJ7dF9BUYRJD_OEQ_zFsaf3cV';
    var supabaseClient = null;

    // --- Global State ---
    const Constants = {
        Countries: ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'UAE', 'Singapore', 'Qatar', 'Oman', 'Bahrain', 'Kuwait', 'Saudi Arabia', 'Malaysia', 'Philippines', 'FRANCE',],
        States: [
            { code: '01', name: '01 - Jammu & Kashmir' },
            { code: '02', name: '02 - Himachal Pradesh' },
            { code: '03', name: '03 - Punjab' },
            { code: '04', name: '04 - Chandigarh' },
            { code: '05', name: '05 - Uttarakhand' },
            { code: '06', name: '06 - Haryana' },
            { code: '07', name: '07 - Delhi' },
            { code: '08', name: '08 - Rajasthan' },
            { code: '09', name: '09 - Uttar Pradesh' },
            { code: '10', name: '10 - Bihar' },
            { code: '11', name: '11 - Sikkim' },
            { code: '12', name: '12 - Arunachal Pradesh' },
            { code: '13', name: '13 - Nagaland' },
            { code: '14', name: '14 - Manipur' },
            { code: '15', name: '15 - Mizoram' },
            { code: '16', name: '16 - Tripura' },
            { code: '17', name: '17 - Meghalaya' },
            { code: '18', name: '18 - Assam' },
            { code: '19', name: '19 - West Bengal' },
            { code: '20', name: '20 - Jharkhand' },
            { code: '21', name: '21 - Odisha' },
            { code: '22', name: '22 - Chhattisgarh' },
            { code: '23', name: '23 - Madhya Pradesh' },
            { code: '24', name: '24 - Gujarat' },
            { code: '25', name: '25 - Daman & Diu' },
            { code: '26', name: '26 - Dadra & Nagar Haveli' },
            { code: '27', name: '27 - Maharashtra' },
            { code: '29', name: '29 - Karnataka' },
            { code: '30', name: '30 - Goa' },
            { code: '31', name: '31 - Lakshadweep' },
            { code: '32', name: '32 - Kerala' },
            { code: '33', name: '33 - Tamil Nadu' },
            { code: '34', name: '34 - Puducherry' },
            { code: '35', name: '35 - Andaman & Nicobar Islands' },
            { code: '36', name: '36 - Telangana' },
            { code: '37', name: '37 - Andhra Pradesh' },
            { code: '38', name: '38 - Ladakh' },
            { code: '97', name: '97 - Other Territory' }
        ]
    };

    const state = {
        user: null,
        view: 'dashboard',
        fy: (() => {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth(); // 0-indexed, April is 3
            // Indian FY: April to March
            return month >= 3 ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`;
        })(),
        products: [
            { id: 'p1', name: 'Standard Stainless Steel Camera', hsn: '8525', price: 45000, gst: 18, type: 'PRODUCT' },
            { id: 'p2', name: 'Cloud Storage License', hsn: '9983', price: 12000, gst: 18, type: 'SERVICE' }
        ],
        customers: [],
        invoices: [],
        purchases: [],
        credit_notes: [],
        debit_notes: [],
        purchase_orders: [],
        quotations: [],
        proforma: [],
        challans: [],
        licenses: [],
        reports: {
            sales: { taxable: 0, tax: 0 },
            purchases: { taxable: 0, tax: 0 }
        }
    };

    // --- DOM Elements ---
    const el = {
        authRoot: document.getElementById('auth-root'),
        mainRoot: document.getElementById('main-root'),
        loginForm: document.getElementById('login-form'),
        loginBtn: document.getElementById('login-btn'),
        viewContainer: document.getElementById('view-container'),
        viewTitle: document.getElementById('view-title'),
        userDisplay: document.getElementById('user-display'),
        statusJs: document.getElementById('status-js'),
        statusText: document.getElementById('status-text'),
        fySelect: document.getElementById('fy-select')
    };

    // --- Initialization ---
    const init = async () => {
        console.log('🚀 App Initialization Started');

        // 1. Mark JS as active in UI
        if (el.statusJs) el.statusJs.classList.add('ready');
        if (el.statusText) el.statusText.textContent = 'Logic Active...';

        // 2. Initialize Supabase
        try {
            if (!window.supabase) {
                console.error('❌ Supabase SDK missing on window');
                if (el.statusText) el.statusText.textContent = 'Error: Supabase SDK Missing';
                return;
            }

            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('⚡ Client Created, verifying session...');

            // Critical test: can we talk to the API?
            const { data, error } = await supabaseClient.auth.getSession();
            if (error) throw error;

            console.log('✅ Supabase Ready & Verified');
            if (el.statusText) el.statusText.textContent = 'System Fully Online (Supabase Ready)';
        } catch (err) {
            console.error('Supabase Init Error:', err);
            if (el.statusText) el.statusText.textContent = 'API Error: ' + (err.message || 'Check Connection');
        }

        // 3. Setup Listeners
        setupGlobalListeners();

        // 4. Check Auth Session
        await checkAuth();

        // 5. Fetch Initial Data if logged in
        if (state.user) {
            await api.masters.fetch();
            await api.invoices.fetch();
            await api.purchases.fetch();
            await api.docs.fetch('quotations');
            await api.docs.fetch('proforma');
            await api.docs.fetch('challans');
            await api.docs.fetch('credit_notes');
            await api.docs.fetch('debit_notes');
            await api.docs.fetch('purchase_orders');
            await api.licenses.fetch();
            await api.reports.fetchStats();
        }
    };

    const setupGlobalListeners = () => {
        el.loginForm?.addEventListener('submit', handleLogin);
        document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
        window.addEventListener('hashchange', () => {
            state.view = window.location.hash.slice(1) || 'dashboard';
            render();
        });

        el.fySelect?.addEventListener('change', (e) => {
            state.fy = e.target.value;
            render();
        });
    };

    // --- Auth Logic ---
    const checkAuth = async () => {
        if (!supabaseClient) return;
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            onAuthSuccess(session.user);
        } else {
            showLogin();
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!email || !password) return;

        el.loginBtn.disabled = true;
        el.loginBtn.textContent = 'Connecting...';

        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) throw error;
            onAuthSuccess(data.user);
        } catch (err) {
            alert('Login failed: ' + err.message);
            el.loginBtn.disabled = false;
            el.loginBtn.textContent = 'Sign In';
        }
    };

    const onAuthSuccess = async (user) => {
        state.user = user;
        el.authRoot.classList.add('hidden');
        el.mainRoot.classList.remove('hidden');
        el.userDisplay.textContent = user.email;

        // Fetch all data after successful auth
        await Promise.all([
            api.masters.fetch(),
            api.invoices.fetch(),
            api.purchases.fetch(),
            api.docs.fetch('quotations'),
            api.docs.fetch('proforma'),
            api.docs.fetch('challans'),
            api.docs.fetch('credit_notes'),
            api.docs.fetch('debit_notes'),
            api.docs.fetch('purchase_orders'),
            api.reports.fetchStats()
        ]);

        render();
    };

    const handleLogout = async () => {
        await supabaseClient.auth.signOut();
        location.reload();
    };

    const showLogin = () => {
        el.authRoot.classList.remove('hidden');
        el.mainRoot.classList.add('hidden');
    };

    const formatDate = (dateStr, options = { day: '2-digit', month: 'Short', year: 'numeric' }) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 'Invalid Date';
        try {
            return d.toLocaleDateString('en-GB', options);
        } catch (e) {
            return d.toLocaleDateString() || 'Error';
        }
    };

    const numberToWords = (num, currency = 'INR') => {
        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        const makeWords = (n) => {
            if (n === 0) return '';
            if (n < 20) return a[n];
            if (n < 100) return b[Math.floor(n / 10)] + ' ' + a[n % 10];
            if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + makeWords(n % 100);
            if (n < 100000) return makeWords(Math.floor(n / 1000)) + 'Thousand ' + makeWords(n % 1000);
            if (n < 10000000) return makeWords(Math.floor(n / 100000)) + 'Lakh ' + makeWords(n % 100000);
            return makeWords(Math.floor(n / 10000000)) + 'Crore ' + makeWords(n % 10000000);
        };

        const amount = parseFloat(num).toFixed(2);
        const [integer, fraction] = amount.split('.');

        const currencyMap = {
            'INR': { main: 'Rupees', sub: 'Paise' },
            'USD': { main: 'Dollars', sub: 'Cents' },
            'EUR': { main: 'Euros', sub: 'Cents' },
            'GBP': { main: 'Pounds', sub: 'Pence' }
        };
        const units = currencyMap[currency] || { main: currency, sub: 'Units' };

        let words = (parseInt(integer) === 0 ? 'Zero ' : makeWords(parseInt(integer))) + units.main + ' ';
        if (parseInt(fraction) > 0) {
            words += 'and ' + makeWords(parseInt(fraction)) + units.sub + ' ';
        }
        return words + 'Only';
    };

    // --- Views & Components (Templates) ---
    const Templates = {
        Dashboard: (data) => `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 animate-slide-up">
            <div class="glass p-6 rounded-2xl shadow-sm border-l-4 border-blue-500">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Sales</p>
                <h4 class="text-2xl font-bold text-slate-900 mt-1">₹${data.sales.toFixed(2)}</h4>
            </div>
            <div class="glass p-6 rounded-2xl shadow-sm border-l-4 border-emerald-500">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tax Collected</p>
                <h4 class="text-2xl font-bold text-emerald-600 mt-1">₹${data.tax.toFixed(2)}</h4>
            </div>
            <div class="glass p-6 rounded-2xl shadow-sm border-l-4 border-orange-500">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ITC Claimed</p>
                <h4 class="text-2xl font-bold text-orange-600 mt-1">₹${data.itc.toFixed(2)}</h4>
            </div>
            <div class="glass p-6 rounded-2xl shadow-sm border-l-4 border-slate-900">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net Payable</p>
                <h4 class="text-2xl font-bold text-slate-900 mt-1">₹${(data.tax - data.itc).toFixed(2)}</h4>
            </div>
        </div>
        <div class="mt-8 glass p-8 rounded-3xl border border-slate-100 min-h-[400px] flex flex-col items-center justify-center text-center">
            <div class="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-2xl mb-4">📈</div>
            <h5 class="text-lg font-bold text-slate-900">Performance Trends</h5>
            <p class="text-sm text-slate-500 max-w-sm mt-2">Charts and analytics are ready to be integrated using the master data in your account.</p>
        </div>
    `,
        Products: (items, filter = 'Items') => `
        <div class="animate-fade-in">
            <div class="dashboard-header">
                <div class="dashboard-title">
                    <h2 class="text-2xl font-bold">Products & Services</h2>
                    <svg class="w-6 h-6 text-pink-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>
                </div>
            </div>

            <div class="status-tabs">
                <div class="tab-item ${filter === 'Items' ? 'active' : ''}" onclick="ui.products.setFilter('Items')">Items <span class="tab-count">${items.length}</span></div>
                <div class="tab-item ${filter === 'Categories' ? 'active' : ''}" onclick="ui.products.setFilter('Categories')">Categories</div>
                <div class="tab-item ${filter === 'Groups' ? 'active' : ''}" onclick="ui.products.setFilter('Groups')">Groups</div>
                <div class="tab-item ${filter === 'Price Lists' ? 'active' : ''}" onclick="ui.products.setFilter('Price Lists')">Price Lists</div>
                <div class="tab-item ${filter === 'Deleted' ? 'active' : ''}" onclick="ui.products.setFilter('Deleted')">Deleted</div>
            </div>

            <div class="toolbar">
                <div class="search-container">
                    <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <input type="text" class="form-input search-input" placeholder="Search products, category, description, barcode..." value="${ui.products.searchQuery || ''}" oninput="ui.products.search(this.value)">
                </div>
                <button class="toolbar-btn">
                    Select Category
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <div class="ml-auto flex items-center gap-2">
                    <button class="p-2 text-slate-400 hover:text-slate-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                    </button>
                    <button class="toolbar-btn">
                        Actions
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                    <button onclick="ui.modal.open('product')" class="bg-[#3b82f6] text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-600 transition-all">+ New Item</button>
                </div>
            </div>

            <div class="glass rounded-2xl overflow-hidden shadow-sm">
                <table class="w-full text-left sales-table">
                    <thead>
                        <tr>
                            <th>Product Name</th>
                            <th>Category / HSN</th>
                            <th>Selling Price</th>
                            <th>GST Rate</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm">
                        ${items.map(i => `
                            <tr class="product-row border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                <td class="p-4">
                                    <div class="flex items-center gap-3">
                                        <div class="item-avatar bg-blue-50 text-blue-600">${i.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div>
                                        <div class="font-bold text-slate-900">${i.name}</div>
                                    </div>
                                </td>
                                <td class="p-4">
                                    <div class="font-medium text-slate-900">${i.type}</div>
                                    <div class="text-[10px] text-slate-500 font-mono tracking-wider">HSN: ${i.hsn || '-'}</div>
                                </td>
                                <td class="p-4">
                                    <div class="font-bold text-slate-900">${i.currency === 'USD' ? '$' : '₹'}${i.price.toLocaleString()}</div>
                                </td>
                                <td class="p-4">
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                        ${i.gst}%
                                    </span>
                                </td>
                                <td class="p-4">
                                    <div class="flex items-center gap-2">
                                        <button onclick="ui.modal.edit('product', '${i.id}')" class="text-slate-400 hover:text-blue-600 transition-colors" title="Edit Product">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                        </button>
                                        <button onclick="api.masters.delete('products', '${i.id}')" class="text-slate-400 hover:text-red-500 transition-colors" title="Delete Product">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="promo-section">
                <div class="promo-image">
                    <img src="https://img.freepik.com/free-vector/warehouse-workers-checking-boxes-logistics-concept-illustration_114360-15509.jpg" alt="Organize Products">
                </div>
                <div class="promo-content">
                    <h2>Organize and streamline all your products.</h2>
                    <ul class="promo-features">
                        <li>
                            <svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                            Bulk upload products in a click
                        </li>
                        <li>
                            <svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                            Keep multiple price lists of your products
                        </li>
                        <li>
                            <svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                            Create batches for products and even group them accordingly
                        </li>
                    </ul>
                    <button onclick="ui.modal.open('product')" class="btn-add-products">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        Add your Products
                    </button>
                    <div class="promo-footer">
                        <a href="#" class="promo-link">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h2.28a2 2 0 011.917 1.285l1.257 3.771a2 2 0 01-1.917 2.715H9.196a11.722 11.722 0 005.093 5.093v-1.114a2 2 0 012.715-1.917l3.771 1.257c.54.18.917.684.917 1.257V21a2 2 0 01-2 2h-1c-10.493 0-19-8.507-19-19V5z"></path></svg>
                            Talk to a specialist
                        </a>
                        <a href="#" class="promo-link">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>
                            Watch how it works
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `,
        Customers: (items, filter = 'All Customers') => `
        <div class="animate-fade-in">
            <div class="dashboard-header">
                <div class="dashboard-title">
                    <h2 class="text-2xl font-bold">Customers</h2>
                    <svg class="w-6 h-6 text-pink-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>
                </div>
            </div>

            <div class="status-tabs">
                <div class="tab-item ${filter === 'All Customers' ? 'active' : ''}" onclick="ui.customers.setFilter('All Customers')">All Customers <span class="tab-count">${items.length}</span></div>
                <div class="tab-item ${filter === 'Groups' ? 'active' : ''}" onclick="ui.customers.setFilter('Groups')">Groups</div>
                <div class="tab-item ${filter === 'Deleted' ? 'active' : ''}" onclick="ui.customers.setFilter('Deleted')">Deleted</div>
            </div>

            <div class="toolbar">
                <div class="search-container">
                    <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <input type="text" class="form-input search-input" placeholder="Search customers by name, company, phone etc.." value="${ui.customers.searchQuery || ''}" oninput="ui.customers.search(this.value)">
                </div>
                <div class="ml-auto flex items-center gap-2">
                    <button class="toolbar-btn">
                        Actions
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                    <button onclick="ui.modal.open('customer')" class="bg-[#3b82f6] text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-600 transition-all">+ New Customer</button>
                </div>
            </div>

            <div class="glass rounded-2xl overflow-hidden shadow-sm">
                <table class="w-full text-left sales-table">
                    <thead>
                        <tr>
                            <th>Company Name</th>
                            <th>GSTIN</th>
                            <th>Primary Contact</th>
                            <th>Location</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm">
                        ${items.map(c => {
            const stateName = Constants.States.find(s => s.code === c.state)?.name.split(' - ')[1] || c.state || '-';
            return `
                            <tr class="product-row border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                <td class="p-4">
                                    <div class="flex items-center gap-3">
                                        <div class="item-avatar bg-indigo-50 text-indigo-600">${c.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div>
                                        <div>
                                            <button onclick="ui.customer.view('${c.id}')" class="font-bold text-slate-900 hover:text-blue-600 text-left">${c.name}</button>
                                            <div class="text-[10px] text-slate-400 font-medium tracking-wide">${c.email || ''}</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="p-4">
                                    <div class="space-y-1">
                                        ${c.gstin ?
                    `<span class="inline-flex items-center gap-1 font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px] uppercase">
                                                GST: ${c.gstin}
                                                <svg class="w-2 h-2 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                                            </span>` : ''
                }
                                        ${c.pan_no ?
                    `<div class="text-[10px] font-mono font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 inline-block uppercase">
                                                PAN: ${c.pan_no}
                                            </div>` : ''
                }
                                        ${!c.gstin && !c.pan_no ? '<span class="text-slate-400 italic text-xs">Unregistered</span>' : ''}
                                    </div>
                                </td>
                                <td class="p-4">
                                    <div class="font-medium text-slate-900">${c.contact_name || '-'}</div>
                                    <div class="text-[10px] text-slate-400 font-medium">${c.contact_mobile || ''}</div>
                                </td>
                                <td class="p-4">
                                    <div class="font-medium text-slate-900">${c.city || '-'}</div>
                                    <div class="text-[10px] text-slate-400 font-medium">${stateName}</div>
                                </td>
                                <td class="p-4">
                                    <div class="flex items-center gap-2">
                                        <button onclick="ui.customer.view('${c.id}')" class="text-slate-400 hover:text-blue-600 transition-colors" title="View Details">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                        </button>
                                        <button onclick="ui.modal.edit('customer', '${c.id}')" class="text-slate-400 hover:text-orange-500 transition-colors" title="Edit Customer">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                        </button>
                                        <button onclick="ui.customer.delete('${c.id}')" class="text-slate-400 hover:text-red-500 transition-colors" title="Delete Customer">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>

            <div class="promo-section">
                <div class="promo-image">
                    <img src="https://img.freepik.com/free-vector/professional-handling-clients-concept-illustration_114360-8451.jpg" alt="Managing Customers">
                </div>
                <div class="promo-content">
                    <h2>Managing customers has never been easier.</h2>
                    <ul class="promo-features">
                        <li>
                            <svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                            Know your customers better
                        </li>
                        <li>
                            <svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                            Organize your customer data effortlessly
                        </li>
                        <li>
                            <svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                            Get insights of your verified customers
                        </li>
                    </ul>
                    <button onclick="ui.modal.open('customer')" class="btn-add-products">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        Start adding your customers
                    </button>
                    <div class="promo-footer">
                        <a href="#" class="promo-link">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h2.28a2 2 0 011.917 1.285l1.257 3.771a2 2 0 01-1.917 2.715H9.196a11.722 11.722 0 005.093 5.093v-1.114a2 2 0 012.715-1.917l3.771 1.257c.54.18.917.684.917 1.257V21a2 2 0 01-2 2h-1c-10.493 0-19-8.507-19-19V5z"></path></svg>
                            Talk to a specialist
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `,
        Invoices: (items, filter = 'All') => {
            const searchQuery = (ui.sales.searchQuery || '').toLowerCase();
            const itemsFY = items.filter(i => isWithinFY(i.date, state.fy));

            // Aggregation for all currencies
            const totals = itemsFY.reduce((acc, inv) => {
                const cur = inv.currency || 'INR';
                const amt = inv.total_amount || 0;
                const status = inv.status || 'Pending';

                if (!acc[cur]) acc[cur] = { total: 0, paid: 0, pending: 0 };
                acc[cur].total += amt;
                if (status === 'Paid') acc[cur].paid += amt;
                else acc[cur].pending += amt;

                return acc;
            }, {
                'INR': { total: 0, paid: 0, pending: 0 },
                'USD': { total: 0, paid: 0, pending: 0 },
                'EUR': { total: 0, paid: 0, pending: 0 }
            });

            // Filter by Status Tab
            let filteredItems = filter === 'All' ? itemsFY : itemsFY.filter(i => (
                i.status === filter ||
                (filter === 'Drafts' && i.status === 'Draft')
            ));

            // Search Filter
            if (searchQuery) {
                filteredItems = filteredItems.filter(i =>
                    (i.invoice_no || '').toLowerCase().includes(searchQuery) ||
                    (i.customers?.name || '').toLowerCase().includes(searchQuery) ||
                    (i.customers?.city || '').toLowerCase().includes(searchQuery) ||
                    (i.type || '').toLowerCase().includes(searchQuery)
                );
            }

            return `
                <div class="animate-fade-in">
                    <div class="dashboard-header">
                        <div class="dashboard-title">
                            <h2>Tax Invoices</h2>
                        </div>
                        <div class="flex items-center gap-4">
                            <button onclick="ui.modal.open('invoice')" class="bg-[#3b82f6] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center gap-2">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                                Create Invoice
                            </button>
                        </div>
                    </div>

                    <div class="status-tabs">
                        <div class="tab-item ${filter === 'All' ? 'active' : ''}" onclick="ui.sales.setFilter('All')">All <span class="tab-count">${itemsFY.length}</span></div>
                        <div class="tab-item ${filter === 'Pending' ? 'active' : ''}" onclick="ui.sales.setFilter('Pending')">Pending</div>
                        <div class="tab-item ${filter === 'Paid' ? 'active' : ''}" onclick="ui.sales.setFilter('Paid')">Paid</div>
                        <div class="tab-item ${filter === 'Cancelled' ? 'active' : ''}" onclick="ui.sales.setFilter('Cancelled')">Cancelled</div>
                        <div class="tab-item ${filter === 'Drafts' ? 'active' : ''}" onclick="ui.sales.setFilter('Drafts')">Drafts</div>
                    </div>

                    <div class="toolbar gap-6">
                        <div class="search-container flex-1">
                            <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            <input type="text" class="form-input search-input" placeholder="Search invoices, customers, city..." value="${ui.sales.searchQuery || ''}" oninput="ui.sales.search(this.value)">
                        </div>

                        <!-- Currency Stats -->
                        <div class="flex items-center gap-4 bg-white border border-slate-100 px-4 py-1.5 rounded-xl shadow-sm">
                            <!-- INR -->
                            <div class="flex flex-col min-w-[80px]">
                                <div class="flex items-center gap-1 mb-0.5">
                                    <div class="w-1 h-2.5 bg-slate-900 rounded-full"></div>
                                    <span class="text-[8px] uppercase tracking-wider font-black text-slate-400">INR</span>
                                </div>
                                <div class="flex items-baseline gap-1.5">
                                    <span class="text-[11px] font-black text-slate-900">₹${totals.INR.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                    <div class="flex gap-1.5">
                                        <span class="text-[8px] font-bold text-emerald-600">P: ₹${totals.INR.paid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                        <span class="text-[8px] font-bold text-red-500">U: ₹${totals.INR.pending.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="w-px h-6 bg-slate-100"></div>
                            <!-- USD -->
                            <div class="flex flex-col min-w-[80px]">
                                <div class="flex items-center gap-1 mb-0.5">
                                    <div class="w-1 h-2.5 bg-blue-600 rounded-full"></div>
                                    <span class="text-[8px] uppercase tracking-wider font-black text-slate-400">USD</span>
                                </div>
                                <div class="flex items-baseline gap-1.5">
                                    <span class="text-[11px] font-black text-blue-600">$${totals.USD.total.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                                    <div class="flex gap-1.5">
                                        <span class="text-[8px] font-bold text-emerald-600">P: $${totals.USD.paid.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                                        <span class="text-[8px] font-bold text-red-500">U: $${totals.USD.pending.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="glass rounded-2xl overflow-hidden shadow-sm">
                        <table class="w-full text-left sales-table">
                            <thead>
                                <tr>
                                    <th>Invoice #</th>
                                    <th>Customer</th>
                                    <th>Type</th>
                                    <th class="text-right">Amount</th>
                                    <th>Status</th>
                                    <th class="text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody class="text-sm">
                                ${filteredItems.length ? filteredItems.map(inv => {
                const currency = inv.currency || 'INR';
                const symbol = { 'INR': '₹', 'USD': '$', 'EUR': '€' }[currency];
                const loc = currency === 'USD' ? 'en-US' : 'en-IN';
                return `
                                    <tr class="hover:bg-slate-50 transition-colors">
                                        <td class="font-bold text-slate-900">${inv.invoice_no}</td>
                                        <td>
                                            <div class="font-bold text-slate-900">${inv.customers?.name || 'Walk-in'}</div>
                                            <div class="text-[10px] text-slate-400 font-medium">${inv.customers?.city || ''}</div>
                                        </td>
                                        <td>
                                            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${inv.type === 'LUT / Export' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}">
                                                ${inv.type || 'Regular'}
                                            </span>
                                        </td>
                                        <td class="text-right">
                                            <div class="font-black text-slate-900 text-sm">
                                                <span class="text-[10px] text-slate-400 font-bold mr-1">${currency}</span>
                                                ${symbol}${inv.total_amount.toLocaleString(loc, { minimumFractionDigits: 2 })}
                                            </div>
                                        </td>
                                        <td>
                                            <span class="status-badge ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}">
                                                ${inv.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td class="text-right p-4">
                                            <div class="flex items-center justify-end gap-2">
                                                ${inv.status !== 'Paid' ? `
                                                    <button onclick="api.invoices.togglePayment('${inv.id}', 'Paid')" class="p-1 px-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1 text-[10px] font-bold" title="Mark as Paid">
                                                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                        Pay
                                                    </button>
                                                ` : `
                                                    <button onclick="api.invoices.togglePayment('${inv.id}', 'Pending')" class="p-1 px-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white transition-all flex items-center gap-1 text-[10px] font-bold" title="Mark as Unpaid">
                                                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                        Unpay
                                                    </button>
                                                `}
                                                <button onclick="api.docs.generatePDF('invoices', '${inv.id}')" class="p-1 px-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-900 hover:text-white transition-all flex items-center gap-1 text-[10px] font-bold">
                                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                                    View
                                                </button>
                                                <button onclick="ui.invoice.edit('${inv.id}')" class="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                                </button>
                                                <button onclick="api.invoices.delete('${inv.id}')" class="p-1.5 rounded-lg bg-slate-50 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `;
            }).join('') : `
                                    <tr>
                                        <td colspan="6">
                                            <div class="empty-state">
                                                <div class="empty-state-icon">Oops 😳 !</div>
                                                <h3>No invoices found.</h3>
                                                <p>Create a new <a href="#" onclick="ui.modal.open('invoice')" class="text-blue-500 font-bold">Invoice</a> to get started.</p>
                                            </div>
                                        </td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        },
        Purchases: (items, filter = 'All') => {
            const itemsFY = items.filter(i => isWithinFY(i.date, state.fy));

            const stats = itemsFY.reduce((acc, p) => {
                acc.total += p.total_amount;
                if (p.status === 'Paid') acc.paid += p.total_amount;
                else acc.pending += p.total_amount;
                return acc;
            }, { total: 0, paid: 0, pending: 0 });

            const filteredItems = filter === 'All' ? itemsFY : itemsFY.filter(i => (
                i.status === filter ||
                (filter === 'Drafts' && i.status === 'Draft')
            ));

            return `
                <div class="animate-fade-in">
                    <div class="dashboard-header">
                        <div class="dashboard-title">
                            <h2>Purchases</h2>
                            <svg class="w-6 h-6 text-pink-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>
                        </div>
                        <div class="flex items-center gap-4">
                            <button class="flex items-center gap-2 text-slate-600 font-medium text-sm">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                Document Settings
                            </button>
                            <button onclick="ui.modal.open('purchase')" class="bg-[#3b82f6] text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-600 transition-all">+ Create Purchase</button>
                        </div>
                    </div>

                    <div class="status-tabs">
                        <div class="tab-item ${filter === 'All' ? 'active' : ''}" onclick="ui.purchases.setFilter('All')">All</div>
                        <div class="tab-item ${filter === 'Pending' ? 'active' : ''}" onclick="ui.purchases.setFilter('Pending')">Pending</div>
                        <div class="tab-item ${filter === 'Paid' ? 'active' : ''}" onclick="ui.purchases.setFilter('Paid')">Paid</div>
                        <div class="tab-item ${filter === 'Cancelled' ? 'active' : ''}" onclick="ui.purchases.setFilter('Cancelled')">Cancelled</div>
                        <div class="tab-item ${filter === 'Drafts' ? 'active' : ''}" onclick="ui.purchases.setFilter('Drafts')">Drafts</div>
                    </div>

                    <div class="toolbar">
                        <div class="search-container">
                            <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            <input type="text" class="form-input search-input" placeholder="Search by transaction, customers, invoice etc..">
                        </div>
                        <button class="toolbar-btn">
                            This Year
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </button>
                        <div class="ml-auto flex items-center gap-2">
                            <button class="toolbar-btn">
                                Actions
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                            </button>
                            <button class="p-2 text-slate-400 hover:text-slate-600">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                            </button>
                        </div>
                    </div>

                    <div class="glass rounded-2xl overflow-hidden shadow-sm">
                        <table class="w-full text-left sales-table">
                            <thead>
                                <tr>
                                    <th>Amount <svg class="inline w-3 h-3 text-slate-300" fill="currentColor" viewBox="0 0 20 20"><path d="M5 12l5 5 5-5H5zM5 8l5-5 5 5H5z"></path></svg></th>
                                    <th>Status <svg class="inline w-4 h-4 text-slate-300" fill="currentColor" viewBox="0 0 24 24"><path d="M3 4h18v2H3V4zm6 7h12v2H9v-2zm-6 7h18v2H3v-2z"></path></svg></th>
                                    <th>Mode <svg class="inline w-4 h-4 text-slate-300" fill="currentColor" viewBox="0 0 24 24"><path d="M3 4h18v2H3V4zm6 7h12v2H9v-2zm-6 7h18v2H3v-2z"></path></svg></th>
                                    <th>Bill # <svg class="inline w-3 h-3 text-slate-300" fill="currentColor" viewBox="0 0 20 20"><path d="M5 12l5 5 5-5H5zM5 8l5-5 5 5H5z"></path></svg></th>
                                    <th>Vendor</th>
                                    <th>Supplier Details</th>
                                    <th>Date <svg class="inline w-3 h-3 text-slate-300" fill="currentColor" viewBox="0 0 20 20"><path d="M5 12l5 5 5-5H5zM5 8l5-5 5 5H5z"></path></svg></th>
                                </tr>
                            </thead>
                            <tbody class="text-sm">
                                ${filteredItems.length ? filteredItems.map(p => `
                                    <tr>
                                        <td>₹${p.total_amount.toLocaleString()}</td>
                                        <td><span class="status-badge ${p.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}">${p.status || 'Pending'}</span></td>
                                        <td>${p.mode || 'Online'}</td>
                                        <td class="font-mono font-bold">${p.vendor_invoice_no}</td>
                                        <td>${p.customers?.name || 'Unknown Vendor'}</td>
                                        <td>${p.customers?.city || ''}</td>
                                        <td>${formatDate(p.date)}<br><span class="text-[10px] text-slate-400">Created time</span></td>
                                    </tr>
                                `).join('') : `
                                    <tr>
                                        <td colspan="7">
                                            <div class="empty-state">
                                                <div class="empty-state-icon">Oops 😳 !</div>
                                                <h3>No purchases found.</h3>
                                                <p>Please select different <a href="#" class="text-blue-500 font-bold">dates</a> or create a new <a href="#" onclick="ui.modal.open('purchase')" class="text-blue-500 font-bold">Purchase</a></p>
                                            </div>
                                        </td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>

                    <div class="footer-stats">
                        <div class="stat-pill total">Total <b>₹${stats.total.toFixed(2)}</b></div>
                        <div class="stat-pill paid">Paid <b>₹${stats.paid.toFixed(2)}</b></div>
                        <div class="stat-pill pending">Pending <b>₹${stats.pending.toFixed(2)}</b></div>
                        <div class="ml-auto flex items-center gap-4 text-sm font-medium text-slate-600">
                            <span>1 / 1</span>
                            <div class="flex gap-2">
                                <button class="p-1.5 rounded-lg bg-slate-100 text-slate-400"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg></button>
                                <button class="p-1.5 rounded-lg bg-slate-100 text-slate-400"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></button>
                            </div>
                        </div>
                    </div>

                    <div class="whatsapp-btn">
                        <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </div>
                </div>
            `;
        },
        Challans: (items, filter = 'All') => {
            const stats = items.reduce((acc, c) => {
                acc.total += c.total_amount;
                if (c.status === 'Closed') acc.closed += c.total_amount;
                return acc;
            }, { total: 0, closed: 0 });

            const filteredItems = filter === 'All' ? items : items.filter(i => (i.status === filter || (filter === 'Open' && i.status === 'open')));

            return `
                <div class="animate-fade-in">
                    <div class="dashboard-header">
                        <div class="dashboard-title">
                            <h2>Delivery Challans</h2>
                            <svg class="w-6 h-6 text-pink-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>
                        </div>
                        <div class="flex items-center gap-4">
                            <button class="flex items-center gap-2 text-slate-600 font-medium text-sm">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                Document Settings
                            </button>
                            <button onclick="ui.modal.open('challans')" class="bg-[#3b82f6] text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-600 transition-all">+ Create Delivery Challan</button>
                        </div>
                    </div>

                    <div class="status-tabs">
                        <div class="tab-item ${filter === 'All' ? 'active' : ''}" onclick="ui.challans.setFilter('All')">All <span class="tab-count">${items.length}</span></div>
                        <div class="tab-item ${filter === 'Cancelled' ? 'active' : ''}" onclick="ui.challans.setFilter('Cancelled')">Cancelled</div>
                        <div class="tab-item ${filter === 'Drafts' ? 'active' : ''}" onclick="ui.challans.setFilter('Drafts')">Drafts</div>
                    </div>

                    <div class="toolbar">
                        <div class="search-container">
                            <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            <input type="text" class="form-input search-input" placeholder="Search by transaction, customers, inv etc..">
                        </div>
                        <button class="toolbar-btn">
                            This Year
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </button>
                        <div class="ml-auto flex items-center gap-2">
                            <button class="toolbar-btn">
                                Actions
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                            </button>
                            <button class="p-2 text-slate-400 hover:text-slate-600">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                            </button>
                        </div>
                    </div>

                    <div class="glass rounded-2xl overflow-hidden shadow-sm">
                        <table class="w-full text-left sales-table">
                            <thead>
                                <tr>
                                    <th>Amount <svg class="inline w-3 h-3 text-slate-300" fill="currentColor" viewBox="0 0 20 20"><path d="M5 12l5 5 5-5H5zM5 8l5-5 5 5H5z"></path></svg></th>
                                    <th>Bill # <svg class="inline w-3 h-3 text-slate-300" fill="currentColor" viewBox="0 0 20 20"><path d="M5 12l5 5 5-5H5zM5 8l5-5 5 5H5z"></path></svg></th>
                                    <th>Customer</th>
                                    <th>Date <svg class="inline w-3 h-3 text-slate-300" fill="currentColor" viewBox="0 0 20 20"><path d="M5 12l5 5 5-5H5zM5 8l5-5 5 5H5z"></path></svg></th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody class="text-sm">
                                ${filteredItems.length ? filteredItems.map(c => `
                                    <tr>
                                        <td class="font-bold">₹${c.total_amount.toLocaleString()}</td>
                                        <td class="font-bold text-slate-600">${c.doc_no || 'DC-' + c.id.slice(0, 3)}</td>
                                        <td>
                                            <div class="font-medium text-slate-900">${c.customers?.name || 'Walk-in Customer'}</div>
                                            <div class="text-[10px] text-slate-400 font-medium">${c.customers?.phone || ''}</div>
                                        </td>
                                        <td>
                                            <div class="font-medium text-slate-900">${formatDate(c.date)}</div>
                                            <div class="text-[10px] text-slate-400 font-medium">Yesterday, 2:11 PM</div>
                                        </td>
                                        <td>
                                            <div class="flex items-center gap-2">
                                                <button class="view-btn">
                                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                                    View
                                                </button>
                                                <button class="send-btn">
                                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                                                    Send
                                                </button>
                                                <button class="p-1 rounded bg-slate-50 text-slate-400 hover:text-slate-600">
                                                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"></path></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('') : `
                                    <tr>
                                        <td colspan="5">
                                            <div class="empty-state">
                                                <div class="empty-state-icon">Oops 😳 !</div>
                                                <h3>No delivery challans found.</h3>
                                                <p>Please select different <a href="#" class="text-blue-500 font-bold">dates</a> or create a new <a href="#" onclick="ui.modal.open('challans')" class="text-blue-500 font-bold">Delivery Challan</a></p>
                                            </div>
                                        </td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        },
        ProForma: (items, filter = 'All') => {
            const searchQuery = (ui.proforma.searchQuery || '').toLowerCase();

            // Aggregation for all items (ignoring status filters but following search if any)
            const totals = items.reduce((acc, q) => {
                const cur = q.currency || 'INR';
                const amt = q.total_amount || 0;
                const payStatus = q.metadata?.payment_status || 'Unpaid';

                if (!acc[cur]) acc[cur] = { total: 0, paid: 0, unpaid: 0 };
                acc[cur].total += amt;
                if (payStatus === 'Paid') acc[cur].paid += amt;
                else acc[cur].unpaid += amt;

                return acc;
            }, {
                'INR': { total: 0, paid: 0, unpaid: 0 },
                'USD': { total: 0, paid: 0, unpaid: 0 },
                'EUR': { total: 0, paid: 0, unpaid: 0 }
            });

            // Filter by Status Tab
            let filteredItems = filter === 'All' ? items : items.filter(i => (
                i.status === filter ||
                (filter === 'Open' && i.status === 'open') ||
                (filter === 'Drafts' && i.status === 'Draft')
            ));

            // Search Filter
            if (searchQuery) {
                filteredItems = filteredItems.filter(i =>
                    (i.doc_no || '').toLowerCase().includes(searchQuery) ||
                    (i.customers?.name || '').toLowerCase().includes(searchQuery) ||
                    (i.customers?.city || '').toLowerCase().includes(searchQuery) ||
                    (i.type || '').toLowerCase().includes(searchQuery) ||
                    (i.metadata?.purchase_no || '').toLowerCase().includes(searchQuery)
                );
            }

            return `
                <div class="animate-fade-in">
                    <div class="dashboard-header">
                        <div class="dashboard-title">
                            <h2>Pro Forma Invoices</h2>
                        </div>
                        
                        <div class="flex items-center gap-6">
                            <button onclick="ui.proforma_v2.activeId = null; ui.modal.open('proforma-new')" class="bg-[#3b82f6] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center gap-2">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                                Create PFI
                            </button>
                        </div>
                    </div>

                    <div class="status-tabs">
                        <div class="tab-item ${filter === 'All' ? 'active' : ''}" onclick="ui.proforma.setFilter('All')">All <span class="tab-count">${items.length}</span></div>
                        <div class="tab-item ${filter === 'Open' ? 'active' : ''}" onclick="ui.proforma.setFilter('Open')">Open</div>
                        <div class="tab-item ${filter === 'Closed' ? 'active' : ''}" onclick="ui.proforma.setFilter('Closed')">Closed</div>
                        <div class="tab-item ${filter === 'Cancelled' ? 'active' : ''}" onclick="ui.proforma.setFilter('Cancelled')">Cancelled</div>
                        <div class="tab-item ${filter === 'Drafts' ? 'active' : ''}" onclick="ui.proforma.setFilter('Drafts')">Drafts</div>
                    </div>

                    <div class="toolbar gap-6">
                        <div class="search-container flex-1">
                            <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            <input type="text" class="form-input search-input" placeholder="Search by transaction, customers, inv etc.." value="${ui.proforma.searchQuery || ''}" oninput="ui.proforma.search(this.value)">
                        </div>

                        <!-- Currency Stats Section -->
                        <div class="flex items-center gap-4 bg-white border border-slate-100 px-4 py-1.5 rounded-xl shadow-sm">
                            <!-- INR -->
                            <div class="flex flex-col min-w-[80px]">
                                <div class="flex items-center gap-1 mb-0.5">
                                    <div class="w-1 h-2.5 bg-slate-900 rounded-full"></div>
                                    <span class="text-[8px] uppercase tracking-wider font-black text-slate-400">INR</span>
                                </div>
                                <div class="flex items-baseline gap-1.5">
                                    <span class="text-[11px] font-black text-slate-900">₹${totals.INR.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                    <div class="flex gap-1.5">
                                        <span class="text-[8px] font-bold text-emerald-600">P: ₹${totals.INR.paid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                        <span class="text-[8px] font-bold text-red-500">U: ₹${totals.INR.unpaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="w-px h-6 bg-slate-100"></div>
                            <!-- USD -->
                            <div class="flex flex-col min-w-[80px]">
                                <div class="flex items-center gap-1 mb-0.5">
                                    <div class="w-1 h-2.5 bg-blue-600 rounded-full"></div>
                                    <span class="text-[8px] uppercase tracking-wider font-black text-slate-400">USD</span>
                                </div>
                                <div class="flex items-baseline gap-1.5">
                                    <span class="text-[11px] font-black text-blue-600">$${totals.USD.total.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                                    <div class="flex gap-1.5">
                                        <span class="text-[8px] font-bold text-emerald-600">P: $${totals.USD.paid.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                                        <span class="text-[8px] font-bold text-red-500">U: $${totals.USD.unpaid.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="w-px h-6 bg-slate-100"></div>
                            <!-- EUR -->
                            <div class="flex flex-col min-w-[80px]">
                                <div class="flex items-center gap-1 mb-0.5">
                                    <div class="w-1 h-2.5 bg-emerald-600 rounded-full"></div>
                                    <span class="text-[8px] uppercase tracking-wider font-black text-slate-400">EUR</span>
                                </div>
                                <div class="flex items-baseline gap-1.5">
                                    <span class="text-[11px] font-black text-emerald-600">€${totals.EUR.total.toLocaleString('en-DE', { maximumFractionDigits: 0 })}</span>
                                    <div class="flex gap-1.5">
                                        <span class="text-[8px] font-bold text-emerald-600">P: €${totals.EUR.paid.toLocaleString('en-DE', { maximumFractionDigits: 0 })}</span>
                                        <span class="text-[8px] font-bold text-red-500">U: €${totals.EUR.unpaid.toLocaleString('en-DE', { maximumFractionDigits: 0 })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="glass rounded-2xl overflow-hidden shadow-sm">
                        <table class="w-full text-left sales-table">
                            <thead>
                                <tr>
                                    <th>PFI #</th>
                                    <th>Customer</th>
                                    <th>PO / Contract</th>
                                    <th>Type</th>
                                    <th class="text-right">Amount</th>
                                    <th>Payment</th>
                                    <th>Status</th>
                                    <th class="text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody class="text-sm">
                                ${filteredItems.length ? filteredItems.map(q => {
                const isExport = q.type === 'LUT / Export';
                const currency = isExport && (!q.currency || q.currency === 'INR') ? 'USD' : (q.currency || 'INR');
                const symbol = { 'INR': '₹', 'USD': '$', 'EUR': '€' }[currency];
                const loc = currency === 'USD' ? 'en-US' : 'en-IN';
                const paymentStatus = q.metadata?.payment_status || 'Unpaid';
                return `
                                    <tr class="hover:bg-slate-50 transition-colors">
                                        <td class="font-bold text-slate-900">${q.doc_no || 'PFI-' + q.id.slice(0, 3)}</td>
                                        <td>
                                            <div class="font-bold text-slate-900">${q.customers?.name || 'Walk-in Customer'}</div>
                                            <div class="text-[10px] text-slate-400 font-medium">${q.customers?.city || ''}</div>
                                        </td>
                                        <td>
                                            <div class="text-xs font-bold text-slate-600">${q.metadata?.purchase_no || '-'}</div>
                                            <div class="text-[9px] text-slate-400">${q.metadata?.purchase_date ? formatDate(q.metadata.purchase_date) : ''}</div>
                                        </td>
                                        <td>
                                            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${q.type === 'LUT / Export' ? 'bg-orange-100 text-orange-700' : (q.type === 'Without GST' ? 'bg-slate-100 text-slate-700' : 'bg-blue-100 text-blue-700')}">
                                                ${q.type || 'Regular'}
                                            </span>
                                            ${q.metadata?.country ? `<div class="text-[9px] text-slate-400 mt-1 font-bold">🚢 ${q.metadata.country}</div>` : ''}
                                        </td>
                                        <td class="text-right">
                                            <div class="flex flex-col items-end">
                                                <div class="font-black text-slate-900 text-sm">
                                                    <span class="text-[10px] text-slate-400 font-bold mr-1">${currency}</span>
                                                    ${symbol}${q.total_amount.toLocaleString(loc, { minimumFractionDigits: 2 })}
                                                </div>
                                                ${isExport && q.currency === 'INR' ? '<div class="text-[8px] text-orange-500 font-bold">Needs Update to USD</div>' : ''}
                                            </div>
                                        </td>
                                        <td>
                                            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}">
                                                ${paymentStatus}
                                            </span>
                                        </td>
                                        <td>
                                            <span class="status-badge ${q.status === 'open' || q.status === 'Open' ? 'open' : (q.status === 'Closed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700')}">
                                                ${q.status || 'open'}
                                            </span>
                                        </td>
                                        <td>
                                            <div class="flex items-center justify-end gap-2">
                                                ${paymentStatus === 'Unpaid' ? `
                                                    <button onclick="api.proforma.togglePaymentStatus('${q.id}', 'Paid')" class="p-1 px-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1 text-[10px] font-bold" title="Mark as Paid">
                                                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                                                        Pay
                                                    </button>
                                                ` : `
                                                    <button onclick="api.proforma.togglePaymentStatus('${q.id}', 'Unpaid')" class="p-1 px-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center gap-1 text-[10px] font-bold" title="Mark as Unpaid">
                                                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                        Unpay
                                                    </button>
                                                `}
                                                <button onclick="api.docs.convertToInvoice('${q.id}')" class="p-1 px-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1 text-[10px] font-bold" title="Convert to Tax Invoice">
                                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                                                    Convert
                                                </button>
                                                <button onclick="api.docs.generatePDF('proforma', '${q.id}')" class="p-1 px-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-900 hover:text-white transition-all flex items-center gap-1 text-[10px] font-bold">
                                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                                    View
                                                </button>
                                                <button onclick="ui.proforma.edit('${q.id}')" class="p-1 px-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1 text-[10px] font-bold">
                                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                                    Edit
                                                </button>
                                                <button onclick="api.docs.delete('proforma', '${q.id}')" class="p-1.5 rounded-lg bg-slate-50 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `;
            }).join('') : `
                                    <tr>
                                        <td colspan="9">
                                            <div class="empty-state">
                                                <div class="empty-state-icon">Oops 😳 !</div>
                                                <h3>No pro forma invoices found.</h3>
                                                <p>Create a new <a href="#" onclick="ui.modal.open('proforma-new')" class="text-blue-500 font-bold">Pro Forma Invoice</a> to get started.</p>
                                            </div>
                                        </td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        },
        Quotations: (items, filter = 'All') => {
            const itemsFY = items.filter(i => isWithinFY(i.date, state.fy));

            const stats = itemsFY.reduce((acc, q) => {
                acc.total += q.total_amount;
                if (q.status === 'Closed') acc.closed += q.total_amount;
                return acc;
            }, { total: 0, closed: 0 });

            let filteredItems = filter === 'All' ? itemsFY : itemsFY.filter(i => (
                i.status === filter ||
                (filter === 'Open' && i.status === 'open') ||
                (filter === 'Drafts' && i.status === 'Draft')
            ));


            if (ui.quotations.searchQuery) {
                const q = ui.quotations.searchQuery.toLowerCase();
                filteredItems = filteredItems.filter(i =>
                    (i.quotation_no && i.quotation_no.toLowerCase().includes(q)) ||
                    (i.customers?.name && i.customers.name.toLowerCase().includes(q)) ||
                    (String(i.total_amount).includes(q))
                );
            }

            // Calculate totals by currency
            const currencyTotals = filteredItems.reduce((acc, item) => {
                const currency = item.currency || 'INR';
                acc[currency] = (acc[currency] || 0) + (item.total_amount || 0);
                return acc;
            }, {});

            const currencyBadges = Object.entries(currencyTotals).map(([currency, total]) => {
                const symbol = { 'INR': '₹', 'USD': '$', 'EUR': '€' }[currency] || currency;
                return `<div class="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 border border-slate-200">
                    ${currency}: <span class="text-slate-900">${symbol}${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>`;
            }).join('');

            return `
                <div class="animate-fade-in">
                    <div class="dashboard-header">
                        <div class="dashboard-title">
                            <h2>Quotations</h2>
                            <svg class="w-6 h-6 text-pink-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>
                        </div>
                        <div class="flex items-center gap-4">

                            <button onclick="ui.modal.open('quotation-new')" class="bg-[#3b82f6] text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-600 transition-all">+ Create Quotation</button>
                        </div>
                    </div>

                    <div class="status-tabs">
                        <div class="tab-item ${filter === 'All' ? 'active' : ''}" onclick="ui.quotations.setFilter('All')">All <span class="tab-count">${items.length}</span></div>
                        <div class="tab-item ${filter === 'Open' ? 'active' : ''}" onclick="ui.quotations.setFilter('Open')">Open</div>
                        <div class="tab-item ${filter === 'Closed' ? 'active' : ''}" onclick="ui.quotations.setFilter('Closed')">Closed</div>
                        <div class="tab-item ${filter === 'Partial' ? 'active' : ''}" onclick="ui.quotations.setFilter('Partial')">Partial</div>
                        <div class="tab-item ${filter === 'Cancelled' ? 'active' : ''}" onclick="ui.quotations.setFilter('Cancelled')">Cancelled</div>
                        <div class="tab-item ${filter === 'Drafts' ? 'active' : ''}" onclick="ui.quotations.setFilter('Drafts')">Drafts</div>
                    </div>

                    <div class="toolbar">
                        <div class="search-container">
                            <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            <input type="text" class="form-input search-input" placeholder="Search by transaction, customers, invoice etc.." value="${ui.quotations.searchQuery || ''}" oninput="ui.quotations.search(this.value)">
                        </div>
                        <div class="flex items-center gap-2 ml-4">
                            ${currencyBadges}
                        </div>

                    </div>

                    <div class="glass rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-slate-50/80 border-b border-slate-100">
                                    <th class="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-48">Quotation & Subject</th>
                                    <th class="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type</th>
                                    <th class="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Details</th>
                                    <th class="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Timeline</th>
                                    <th class="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Value</th>
                                    <th class="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
                                    <th class="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="text-xs divide-y divide-slate-50">
                                ${filteredItems.length ? filteredItems.map(q => {
                const symbol = { 'INR': '₹', 'USD': '$', 'EUR': '€' }[q.currency || 'INR'];
                const validityDate = q.validity_date ? new Date(q.validity_date) : null;
                const isExpired = validityDate && validityDate < new Date();

                return `
                                    <tr class="hover:bg-slate-50/50 transition-colors group">
                                        <td class="p-4">
                                            <div class="font-bold text-slate-900 mb-0.5">${q.quotation_no}</div>
                                            <div class="text-[10px] text-slate-400 font-medium truncate max-w-[180px]">${q.subject || q.reference || 'No Reference'}</div>
                                        </td>
                                        <td class="p-4">
                                            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${q.type === 'LUT / Export' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}">
                                                ${q.type || 'Regular'}
                                            </span>
                                        </td>
                                        <td class="p-4">
                                            <div class="font-bold text-slate-700">${q.customers?.name || 'Walk-in Customer'}</div>
                                            <div class="flex items-center gap-2 mt-1">
                                                <span class="text-[10px] text-slate-400">${q.customers?.city || 'No City'}</span>
                                                <span class="w-1 h-1 bg-slate-200 rounded-full"></span>
                                                <span class="text-[10px] text-slate-400">${q.customers?.phone || ''}</span>
                                            </div>
                                        </td>
                                        <td class="p-4">
                                            <div class="flex flex-col gap-1">
                                                <div class="flex items-center gap-2">
                                                    <span class="text-[10px] text-slate-400 w-8">Date:</span>
                                                    <span class="font-medium text-slate-600">${formatDate(q.date, { day: '2-digit', month: 'Short' })}</span>
                                                </div>
                                                <div class="flex items-center gap-2">
                                                    <span class="text-[10px] text-slate-400 w-8">Valid:</span>
                                                    <span class="font-medium ${isExpired ? 'text-red-500' : 'text-slate-600'}">
                                                        ${formatDate(q.validity_date, { day: '2-digit', month: 'Short' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="p-4 text-right">
                                            <div class="font-bold text-slate-900">${symbol}${q.total_amount.toLocaleString()}</div>
                                            <div class="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">${q.currency || 'INR'}</div>
                                        </td>
                                        <td class="p-4 text-center">
                                            <span class="status-badge ${q.status?.toLowerCase() === 'open' ? 'open' : (q.status === 'Closed' ? 'bg-emerald-100 text-emerald-700 text-[10px]' : 'bg-slate-100 text-slate-700 text-[10px]')}">
                                                ${q.status || 'Open'}
                                            </span>
                                        </td>
                                        <td class="p-4">
                                            <div class="flex items-center justify-center gap-1">
                                                <button onclick="ui.quotations.edit('${q.id}')" class="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors" title="Edit / Create Revision">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                                </button>
                                                <button onclick="api.docs.generatePDF('quotations', '${q.id}')" class="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Download PDF">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    `;
            }).join('') : `
                                    <tr>
                                        <td colspan="7">
                                            <div class="empty-state py-20 bg-slate-50/30">
                                                <div class="empty-state-icon opacity-50 grayscale mb-4 text-4xl">🧾</div>
                                                <h3 class="text-slate-600 font-bold">No quotations found.</h3>
                                                <p class="text-slate-400 text-xs">Try searching with a reference or customer name.</p>
                                                <button onclick="ui.modal.open('quotation-new')" class="mt-6 bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:scale-105 transition-all">Create New Quotation</button>
                                            </div>
                                        </td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>


                </div>
            `;
        },
        Reports: (data) => `
        <div class="space-y-6 animate-fade-in p-4">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- GSTR-1 Preview -->
                <div class="glass p-8 rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden">
                    <div class="absolute top-0 right-0 p-4 opacity-10 text-6xl font-black">GSTR 1</div>
                    <div class="relative z-10">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-xl font-black text-slate-900">GSTR-1 Summary</h3>
                            <span class="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/30">Outward</span>
                        </div>
                        
                        <!-- GSTR-1 Generation Controls -->
                        <div class="mb-6 p-4 bg-blue-50/30 rounded-2xl border border-blue-100">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Generate GSTR-1 Return</p>
                            <div class="grid grid-cols-3 gap-3 mb-3">
                                <div>
                                    <label class="text-[9px] font-bold text-slate-500 uppercase block mb-1">Month</label>
                                    <select id="gstr1-month" class="w-full text-xs font-bold bg-white border border-blue-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        <option value="">Select Month</option>
                                        <option value="0">January</option>
                                        <option value="1">February</option>
                                        <option value="2">March</option>
                                        <option value="3">April</option>
                                        <option value="4">May</option>
                                        <option value="5">June</option>
                                        <option value="6">July</option>
                                        <option value="7">August</option>
                                        <option value="8">September</option>
                                        <option value="9">October</option>
                                        <option value="10">November</option>
                                        <option value="11">December</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="text-[9px] font-bold text-slate-500 uppercase block mb-1">Financial Year</label>
                                    <select id="gstr1-fy" class="w-full text-xs font-bold bg-white border border-blue-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        <option value="">Select FY</option>
                                        <option value="2024-25">2024-25</option>
                                        <option value="2025-26">2025-26</option>
                                        <option value="2026-27">2026-27</option>
                                    </select>
                                </div>
                                <div class="flex items-end">
                                    <button onclick="ui.reports.generateGSTR1()" class="w-full bg-blue-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
                                        Generate from Records
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4 mb-8">
                            <div class="bg-blue-50/50 p-4 rounded-2xl">
                                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Taxable</p>
                                <p class="text-2xl font-black text-slate-900">₹${data.sales.taxable.toLocaleString()}</p>
                            </div>
                            <div class="bg-indigo-50/50 p-4 rounded-2xl">
                                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total GST</p>
                                <p class="text-2xl font-black text-blue-600">₹${data.sales.tax.toLocaleString()}</p>
                            </div>
                        </div>

                        <div class="space-y-4">
                            <div class="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition-all cursor-pointer group" onclick="ui.reports.openModal('b2b')">
                                <div class="flex items-center gap-4">
                                    <div class="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black text-sm">B2B</div>
                                    <div>
                                        <p class="text-sm font-black text-slate-900">Registered</p>
                                        <p class="text-[10px] text-slate-400 font-bold uppercase">Business to Business</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="text-sm font-black text-slate-900">₹${data.sales.b2b.toLocaleString()}</p>
                                    <p class="text-[10px] text-emerald-500 font-bold">Details →</p>
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-4">
                                <div class="p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition-all cursor-pointer group" onclick="ui.reports.openModal('b2cs')">
                                    <div class="flex justify-between items-start mb-2">
                                        <div class="w-8 h-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center font-black text-[10px]">B2CS</div>
                                        <span class="text-[10px] text-orange-500 font-bold">Small →</span>
                                    </div>
                                    <p class="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">B2C Small</p>
                                    <p class="text-sm font-black text-slate-900">₹${data.sales.b2cs.toLocaleString()}</p>
                                </div>
                                <div class="p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition-all cursor-pointer group" onclick="ui.reports.openModal('b2cl')">
                                    <div class="flex justify-between items-start mb-2">
                                        <div class="w-8 h-8 bg-pink-50 text-pink-600 rounded-lg flex items-center justify-center font-black text-[10px]">B2CL</div>
                                        <span class="text-[10px] text-pink-500 font-bold">Large →</span>
                                    </div>
                                    <p class="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">B2C Large (>2.5L)</p>
                                    <p class="text-sm font-black text-slate-900">₹${data.sales.b2cl.toLocaleString()}</p>
                                </div>
                            </div>
                            
                            <div class="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition-all cursor-pointer group" onclick="ui.reports.openModal('exp')">
                                <div class="flex items-center gap-4">
                                    <div class="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-black text-sm">EXP</div>
                                    <div>
                                        <p class="text-sm font-black text-slate-900">Exports</p>
                                        <p class="text-[10px] text-slate-400 font-bold uppercase">LUT / With Tax</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="text-sm font-black text-slate-900">₹${data.sales.exp.toLocaleString()}</p>
                                    <p class="text-[10px] text-purple-500 font-bold">Details →</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- GSTR-3B Preview -->
                <div class="glass p-8 rounded-3xl border border-orange-100 shadow-sm relative overflow-hidden">
                    <div class="absolute top-0 right-0 p-4 opacity-10 text-6xl font-black">GSTR 3B</div>
                    <div class="relative z-10">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-xl font-black text-slate-900">GSTR-3B Summary</h3>
                            <span class="bg-orange-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/30">Self-Assessment</span>
                        </div>

                        <div class="space-y-6">
                            <div class="p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                                <div class="flex justify-between items-center mb-4">
                                    <span class="text-xs font-black text-slate-500 uppercase tracking-widest">Tax Liability</span>
                                    <span class="text-sm font-black lg:text-base">₹${data.sales.tax.toLocaleString()}</span>
                                </div>
                                <div class="flex justify-between items-center mb-6">
                                    <span class="text-xs font-black text-slate-500 uppercase tracking-widest">Available ITC</span>
                                    <span class="text-sm font-black text-orange-600 lg:text-base">- ₹${data.purchases.tax.toLocaleString()}</span>
                                </div>
                                <div class="pt-6 border-t border-slate-200 flex justify-between items-center">
                                    <div>
                                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Tax Payable</p>
                                        <p class="text-3xl font-black text-slate-900">₹${Math.max(0, data.sales.tax - data.purchases.tax).toLocaleString()}</p>
                                    </div>
                                    <button class="bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-slate-200" onclick="ui.reports.openModal('3b')">Detailed 3B View</button>
                                </div>
                            </div>

                            <!-- Analytics Prompt -->
                            <div class="p-6 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl text-white shadow-xl shadow-blue-200">
                                <h4 class="text-lg font-black mb-2 flex items-center gap-2">
                                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"></path></svg>
                                    Ready to File?
                                </h4>
                                <p class="text-xs text-blue-100 mb-6 font-medium">Export your transaction data in structured formats for easier reporting.</p>
                                <div class="flex gap-3">
                                    <button class="flex-1 bg-white/20 backdrop-blur-md text-white border border-white/30 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/30 transition-all text-center" onclick="ui.reports.exportJSON()">JSON Object</button>
                                    <button class="flex-1 bg-white text-blue-700 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all text-center shadow-lg" onclick="ui.reports.exportExcel()">Excel Export</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- HSN Summary Table (Table 12) -->
            <div class="glass p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h3 class="text-xl font-black text-slate-900">HSN-Wise Summary</h3>
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">GSTR-1 Table 12 - Outward Supplies</p>
                    </div>
                    <span class="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Mandatory Filing Data</span>
                </div>

                <div class="overflow-hidden bg-white border border-slate-100 rounded-3xl">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <th class="p-4">HSN/SAC</th>
                                <th class="p-4">Description</th>
                                <th class="p-4 text-right">Taxable Value</th>
                                <th class="p-4 text-right">Total Tax</th>
                                <th class="p-4 text-right">Total Value</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            ${Object.values(data.hsn).length === 0 ? `
                                <tr>
                                    <td colspan="5" class="p-8 text-center text-slate-300 italic font-medium">No transaction data available for HSN summary.</td>
                                </tr>
                            ` : Object.values(data.hsn).map(h => `
                                <tr class="hover:bg-slate-50 transition-all">
                                    <td class="p-4 font-mono font-black text-slate-900">${h.code}</td>
                                    <td class="p-4 font-bold text-slate-600 text-xs">${h.desc}</td>
                                    <td class="p-4 text-right font-black text-slate-900 text-xs">₹${h.taxable.toLocaleString()}</td>
                                    <td class="p-4 text-right font-bold text-blue-600 text-xs">₹${h.tax.toLocaleString()}</td>
                                    <td class="p-4 text-right font-black text-slate-900 text-xs">₹${(h.taxable + h.tax).toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        `,
        DocList: (type, items) => {
            const config = {
                quotations: { title: 'Quotations', btn: 'Create Quotation', color: 'teal', prefix: 'QTN' },
                orders: { title: 'Sales Orders', btn: 'New Order', color: 'indigo', prefix: 'SO' },
                proforma: { title: 'Pro Forma Invoices', btn: 'Issue Pro Forma', color: 'sky', prefix: 'PFI' },
                challans: { title: 'Delivery Challans', btn: 'Generate Challan', color: 'emerald', prefix: 'DC' },
                credit_notes: { title: 'Credit Notes', btn: 'Issue Credit Note', color: 'rose', prefix: 'CN' },
                debit_notes: { title: 'Debit Notes', btn: 'Issue Debit Note', color: 'amber', prefix: 'DN' },
                purchase_orders: { title: 'Purchase Orders', btn: 'New PO', color: 'violet', prefix: 'PO' }
            }[type];

            return `
                <div class="glass rounded-2xl overflow-hidden animate-fade-in shadow-sm">
                    <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div class="flex items-center gap-3">
                            <div class="w-2 h-6 bg-${config.color}-500 rounded-full"></div>
                            <h4 class="font-bold text-slate-900">${config.title}</h4>
                        </div>
                        <button onclick="ui.modal.open('${type === 'quotations' ? 'quotation-new' : type}')" class="bg-${config.color}-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-${config.color}-700 transition-all shadow-sm shadow-${config.color}-500/10">+ ${config.btn}</button>
                    </div>
                    <table class="w-full text-left">
                        <thead class="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-400">
                            <tr><th class="p-4">Doc #</th><th class="p-4">Date</th><th class="p-4">Customer</th><th class="p-4 text-right">Total</th><th class="p-4 text-center">Actions</th></tr>
                        </thead>
                        <tbody class="text-sm divide-y divide-slate-50">
                            ${items.length ? items.map(doc => `
                                <tr>
                                    <td class="p-4 font-mono font-bold text-${config.color}-600">${doc.doc_no || doc.quotation_no || doc.order_no}</td>
                                    <td class="p-4">${formatDate(doc.date)}</td>
                                    <td class="p-4 text-slate-700 font-medium">${doc.customers?.name || 'Walk-in Customer'}</td>
                                    <td class="p-4 text-right font-bold text-slate-900">₹${doc.total_amount.toLocaleString()}</td>
                                    <td class="p-4 text-center">
                                        <button onclick="api.docs.generatePDF('${type}', '${doc.id}')" class="text-blue-500 hover:text-blue-700 mx-1 text-xs font-bold uppercase tracking-tighter">View</button>
                                        ${type === 'proforma' ? `<button onclick="api.docs.convertToInvoice('${doc.id}')" class="text-emerald-500 hover:text-emerald-700 mx-1 text-xs font-bold uppercase tracking-tighter">Convert</button>` : ''}
                                        <button onclick="api.docs.delete('${type}', '${doc.id}')" class="text-red-500 hover:text-red-700 mx-1 text-xs font-bold uppercase tracking-tighter">Del</button>
                                    </td>
                                </tr>
                            `).join('') : `<tr><td colspan="5" class="p-12 text-center text-slate-400 italic">No ${config.title} found for this period.</td></tr>`}
                        </tbody>
                    </table>
                </div>
    `;
        },
        Settings: (data) => `
        <div class="max-w-4xl mx-auto animate-slide-up pb-12">
            <div class="glass p-8 rounded-3xl shadow-sm border border-slate-100">
                <div class="flex items-center gap-4 mb-8">
                    <div class="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-slate-900/20">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold text-slate-900">System Settings</h2>
                        <p class="text-sm text-slate-500">Manage your company profile, branding, and billing details.</p>
                    </div>
                </div>

                <form onsubmit="api.settings.save(event)" class="space-y-8">
                    <!-- Basic Info -->
                    <div class="space-y-4">
                        <h3 class="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">Company Profile</h3>
                        <div class="grid grid-cols-2 gap-6">
                            <div>
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Company Name</label>
                                <input type="text" name="company_name" class="form-input" value="${data.company_name || ''}" required placeholder="Your Company Name">
                            </div>
                            <div>
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Company Email</label>
                                <input type="email" name="company_email" class="form-input" value="${data.company_email || ''}" placeholder="official@company.com">
                            </div>
                            <div>
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Phone Number</label>
                                <input type="tel" name="company_phone" class="form-input" value="${data.company_phone || ''}" placeholder="+91 98765 43210">
                            </div>
                            <div>
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Website</label>
                                <input type="url" name="website" class="form-input" value="${data.website || ''}" placeholder="https://www.company.com">
                            </div>
                        </div>
                    </div>

                    <!-- Tax & Registration -->
                    <div class="space-y-4">
                        <h3 class="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">Registration Details</h3>
                        <div class="grid grid-cols-2 gap-6">
                            <div>
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">GSTIN</label>
                                <input type="text" name="gstin" class="form-input font-mono uppercase" value="${data.gstin || ''}" placeholder="22AAAAA0000A1Z5">
                            </div>
                            <div>
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">State (Supply Source)</label>
                                <select name="state" class="form-input">
                                    <option value="">Select State</option>
                                    ${Constants.States.map(s => `<option value="${s.name}" ${data.state === s.name ? 'selected' : ''}>${s.name}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">PAN Number</label>
                                <input type="text" name="pan_no" class="form-input font-mono uppercase" value="${data.pan_no || ''}" placeholder="ABCDE1234F">
                            </div>
                            <div>
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">MSME / Udyam No</label>
                                <input type="text" name="msme_no" class="form-input uppercase" value="${data.msme_no || ''}" placeholder="UDYAM-XX-00-0000000">
                            </div>
                        </div>
                    </div>

                    <!-- Address -->
                    <div class="space-y-4">
                        <h3 class="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">Registered Address</h3>
                        <div>
                            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Full Address</label>
                            <textarea name="address" class="form-input h-24 resize-none" placeholder="Enter complete address with city, state, pin code...">${data.address || ''}</textarea>
                        </div>
                    </div>

                    <!-- Branding -->
                    <div class="space-y-4">
                        <h3 class="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">Branding & Assets</h3>
                        <div class="grid grid-cols-3 gap-6">
                            <!-- Logo -->
                            <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center group relative">
                                <label class="block cursor-pointer">
                                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Company Logo</span>
                                    <div class="w-32 h-32 mx-auto bg-white rounded-lg shadow-sm flex items-center justify-center overflow-hidden mb-3 border border-slate-200">
                                        ${data.company_logo ? `<img src="${data.company_logo}" class="w-full h-full object-contain">` : `<span class="text-slate-300 text-xs">No Logo</span>`}
                                    </div>
                                    <input type="file" name="company_logo" accept="image/*" class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
                                </label>
                            </div>

                            <!-- Signature -->
                            <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                                <label class="block cursor-pointer">
                                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Authorized Signature</span>
                                    <div class="w-32 h-32 mx-auto bg-white rounded-lg shadow-sm flex items-center justify-center overflow-hidden mb-3 border border-slate-200">
                                        ${data.signature ? `<img src="${data.signature}" class="w-full h-full object-contain">` : `<span class="text-slate-300 text-xs">No Signature</span>`}
                                    </div>
                                    <input type="file" name="signature" accept="image/*" class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
                                </label>
                            </div>

                            <!-- Stamp -->
                            <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                                <label class="block cursor-pointer">
                                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Company Stamp</span>
                                    <div class="w-32 h-32 mx-auto bg-white rounded-lg shadow-sm flex items-center justify-center overflow-hidden mb-3 border border-slate-200">
                                        ${data.stamp ? `<img src="${data.stamp}" class="w-full h-full object-contain">` : `<span class="text-slate-300 text-xs">No Stamp</span>`}
                                    </div>
                                    <input type="file" name="stamp" accept="image/*" class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Bank Accounts -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <!-- INR Account -->
                        <div class="space-y-4">
                            <h3 class="text-sm font-bold text-slate-900 border-b border-indigo-100 pb-2 uppercase tracking-wider flex items-center gap-2">
                                <span class="w-6 h-6 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center text-[10px]">₹</span>
                                Domestic Account (INR)
                            </h3>
                            <div class="space-y-3">
                                <div>
                                    <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Account Name</label>
                                    <input type="text" name="bank_inr_name" class="form-input text-xs" value="${data.bank_inr_name || ''}" placeholder="e.g. Laga Business Solutions">
                                </div>
                                <div class="grid grid-cols-2 gap-3">
                                    <div>
                                        <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Account Number</label>
                                        <input type="text" name="bank_inr_acc_no" class="form-input text-xs font-mono" value="${data.bank_inr_acc_no || ''}" placeholder="000000000000">
                                    </div>
                                    <div>
                                        <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Branch</label>
                                        <input type="text" name="bank_inr_branch" class="form-input text-xs" value="${data.bank_inr_branch || ''}" placeholder="Main Branch">
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 gap-3">
                                    <div>
                                        <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">IFSC Code</label>
                                        <input type="text" name="bank_inr_ifsc" class="form-input text-xs font-mono uppercase" value="${data.bank_inr_ifsc || ''}" placeholder="HDFC0001234">
                                    </div>
                                    <div>
                                        <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">SWIFT Code</label>
                                        <input type="text" name="bank_inr_swift" class="form-input text-xs font-mono uppercase" value="${data.bank_inr_swift || ''}" placeholder="Optional">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- USD Account -->
                        <div class="space-y-4">
                            <h3 class="text-sm font-bold text-slate-900 border-b border-blue-100 pb-2 uppercase tracking-wider flex items-center gap-2">
                                <span class="w-6 h-6 bg-blue-50 text-blue-600 rounded flex items-center justify-center text-[10px]">$</span>
                                International Account (USD)
                            </h3>
                            <div class="space-y-3">
                                <div>
                                    <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Account Name</label>
                                    <input type="text" name="bank_usd_name" class="form-input text-xs" value="${data.bank_usd_name || ''}" placeholder="e.g. Laga Systems USD">
                                </div>
                                <div class="grid grid-cols-2 gap-3">
                                    <div>
                                        <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Account Number</label>
                                        <input type="text" name="bank_usd_acc_no" class="form-input text-xs font-mono" value="${data.bank_usd_acc_no || ''}" placeholder="000000000000">
                                    </div>
                                    <div>
                                        <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Branch</label>
                                        <input type="text" name="bank_usd_branch" class="form-input text-xs" value="${data.bank_usd_branch || ''}" placeholder="Main Branch">
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 gap-3">
                                    <div>
                                        <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">IFSC Code</label>
                                        <input type="text" name="bank_usd_ifsc" class="form-input text-xs font-mono uppercase" value="${data.bank_usd_ifsc || ''}" placeholder="Optional">
                                    </div>
                                    <div>
                                        <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">SWIFT Code</label>
                                        <input type="text" name="bank_usd_swift" class="form-input text-xs font-mono uppercase" value="${data.bank_usd_swift || ''}" placeholder="CHASEUS33">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end pt-6 border-t border-slate-100">
                        <button type="submit" class="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                            Save Settings
                        </button>
                    </div>
                </form>
            </div>
        </div>
        `,
        Licenses: (items, filters = {}) => {
            const now = new Date();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);

            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            const searchQuery = (ui.licenses.searchQuery || '').toLowerCase();

            // Apply Filters and Search
            let filteredItems = items.filter(i => {
                const matchCategory = !filters.category || i.category === filters.category;
                const matchType = !filters.type || i.type === filters.type;
                const matchSearch = !searchQuery ||
                    (i.software_name || '').toLowerCase().includes(searchQuery) ||
                    (i.serial_number || '').toLowerCase().includes(searchQuery) ||
                    (i.customers?.name || '').toLowerCase().includes(searchQuery);

                return matchCategory && matchType && matchSearch;
            });

            const active = items.filter(i => i.status === 'In Warranty');
            const expired = items.filter(i => i.status === 'Expired');
            const expiringWeek = items.filter(i => {
                const ed = new Date(i.end_date);
                return ed >= now && ed <= endOfWeek;
            });
            const expiringMonth = items.filter(i => {
                const ed = new Date(i.end_date);
                return ed >= now && ed <= endOfMonth;
            });

            return `
            <div class="animate-fade-in space-y-8 pb-12">
                <!-- Dashboard / Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div class="glass p-6 rounded-3xl border border-emerald-100 shadow-sm transition-all hover:shadow-md">
                        <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Active Licenses</p>
                        <h4 class="text-3xl font-black text-slate-900">${active.length}</h4>
                        <div class="mt-2 text-[10px] font-bold text-slate-400 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">Current FY</div>
                    </div>
                    <div class="glass p-6 rounded-3xl border border-rose-100 shadow-sm transition-all hover:shadow-md">
                        <p class="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Expired</p>
                        <h4 class="text-3xl font-black text-slate-900">${expired.length}</h4>
                        <div class="mt-2 text-[10px] font-bold text-slate-400 bg-rose-50 px-2 py-0.5 rounded-full inline-block">Action Required</div>
                    </div>
                    <div class="glass p-6 rounded-3xl border border-amber-100 shadow-sm transition-all hover:shadow-md">
                        <p class="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Expiring this Week</p>
                        <h4 class="text-3xl font-black text-slate-900">${expiringWeek.length}</h4>
                        <div class="mt-2 text-[10px] font-bold text-slate-400 bg-amber-50 px-2 py-0.5 rounded-full inline-block">Urgent Renewal</div>
                    </div>
                    <div class="glass p-6 rounded-3xl border border-blue-100 shadow-sm transition-all hover:shadow-md">
                        <p class="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Expiring this Month</p>
                        <h4 class="text-3xl font-black text-slate-900">${expiringMonth.length}</h4>
                        <div class="mt-2 text-[10px] font-bold text-slate-400 bg-blue-50 px-2 py-0.5 rounded-full inline-block">Upcoming Renewals</div>
                    </div>
                </div>

                <!-- Main Data View -->
                <div class="glass rounded-3xl overflow-hidden shadow-sm border border-slate-100 bg-white/50">
                    <div class="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-4">
                        <div class="flex items-center gap-3">
                            <div class="w-2 h-6 bg-slate-900 rounded-full"></div>
                            <h4 class="font-bold text-slate-900">License Registry</h4>
                            <span class="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">${filteredItems.length} Records</span>
                        </div>
                        <div class="flex items-center gap-3 w-full md:w-auto">
                            <input type="text" id="lic-search-input" placeholder="Search by software or serial..." value="${ui.licenses.searchQuery || ''}" oninput="ui.licenses.search(this.value)" class="bg-white border text-sm rounded-xl px-4 py-2 outline-none w-full md:w-64 focus:ring-2 focus:ring-blue-500/20">
                            <button onclick="ui.modal.open('license')" class="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95 shrink-0">+ Add License</button>
                        </div>
                    </div>

                    <!-- Filters Header -->
                    <div class="px-6 py-3 border-b border-slate-50 bg-white/30 flex flex-wrap gap-4">
                        <select onchange="ui.licenses.filter('category', this.value)" class="bg-white border text-[10px] font-black uppercase tracking-widest rounded-lg px-3 py-1.5 outline-none">
                            <option value="">All Categories</option>
                            <option value="Academic" ${filters.category === 'Academic' ? 'selected' : ''}>Academic</option>
                            <option value="Government" ${filters.category === 'Government' ? 'selected' : ''}>Government</option>
                            <option value="Consultancy" ${filters.category === 'Consultancy' ? 'selected' : ''}>Consultancy</option>
                        </select>
                        <select onchange="ui.licenses.filter('type', this.value)" class="bg-white border text-[10px] font-black uppercase tracking-widest rounded-lg px-3 py-1.5 outline-none">
                            <option value="">All Types</option>
                            <option value="New" ${filters.type === 'New' ? 'selected' : ''}>New</option>
                            <option value="Renewal" ${filters.type === 'Renewal' ? 'selected' : ''}>Renewal</option>
                        </select>
                        <button onclick="ui.licenses.export()" class="ml-auto text-blue-600 text-[10px] font-black uppercase tracking-widest hover:text-blue-700">Export Registry</button>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <th class="p-4 border-b border-slate-100">Customer</th>
                                    <th class="p-4 border-b border-slate-100">Software</th>
                                    <th class="p-4 border-b border-slate-100">Serial Number</th>
                                    <th class="p-4 border-b border-slate-100">Expiry Date</th>
                                    <th class="p-4 border-b border-slate-100">Status</th>
                                    <th class="p-4 border-b border-slate-100 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                ${filteredItems.length ? filteredItems.map(lic => {
                const ed = new Date(lic.end_date);
                const diffDays = Math.ceil((ed - now) / (1000 * 60 * 60 * 24));
                let statusColor = 'bg-emerald-100 text-emerald-700';
                if (lic.status === 'Expired') statusColor = 'bg-rose-100 text-rose-700';
                else if (diffDays <= 30) statusColor = 'bg-amber-100 text-amber-700';

                return `
                                    <tr class="hover:bg-slate-50/50 transition-all group">
                                        <td class="p-4">
                                            <p class="font-bold text-slate-900">${lic.customers?.name || 'Unknown'}</p>
                                            <p class="text-[10px] text-slate-400 font-medium">${lic.location || '-'}</p>
                                        </td>
                                        <td class="p-4">
                                            <p class="font-bold text-slate-900">${lic.software_name || '-'}</p>
                                            <p class="text-[10px] text-slate-400 font-black uppercase">${lic.category || '-'}</p>
                                        </td>
                                        <td class="p-4 font-mono text-xs font-bold text-slate-600">${lic.serial_number || '-'}</td>
                                        <td class="p-4">
                                            <p class="font-bold text-slate-900">${formatDate(lic.end_date)}</p>
                                            <p class="text-[10px] ${diffDays < 0 ? 'text-rose-500' : 'text-slate-400'} font-bold">${diffDays < 0 ? 'Expired' : `${diffDays} days remaining`}</p>
                                        </td>
                                        <td class="p-4">
                                            <span class="${statusColor} px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                                                ${lic.status}
                                            </span>
                                        </td>
                                        <td class="p-4 text-center">
                                            <div class="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onclick="ui.modal.open('license', {id: '${lic.id}'})" class="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                </button>
                                                <button onclick="api.licenses.delete('${lic.id}')" class="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                `;
            }).join('') : `
                                    <tr>
                                        <td colspan="6" class="p-12 text-center text-slate-400 italic">No license records found matching your filters.</td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            `;
        },
        LicenseForm: (data = {}) => `
        <div class="modal-content bg-white p-8 rounded-3xl w-full max-w-4xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <h3 class="text-xl font-bold text-slate-900 mb-6 font-display">${data.id ? 'Edit License' : 'Add New License'}</h3>
            <form id="license-form" onsubmit="api.licenses.save(event)" class="space-y-6">
                <input type="hidden" name="id" value="${data.id || ''}">
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Master Data Integration -->
                    <div class="space-y-4">
                        <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Customer Selection</h4>
                        <div>
                            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Customer Name <span class="text-red-500">*</span></label>
                            <select name="customer_id" id="lic-customer-id" required onchange="ui.licenses.onCustomerChange(this.value)" class="form-input">
                                <option value="">Select Customer...</option>
                                ${state.customers.map(c => `<option value="${c.id}" ${data.customer_id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Location</label>
                                <input type="text" name="location" id="lic-location" value="${data.location || ''}" class="form-input" placeholder="Billing City">
                            </div>
                            <div>
                                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Contact Person</label>
                                <select name="contact_person" id="lic-contact-person" class="form-input">
                                    <option value="">Select Contact...</option>
                                    ${data.contacts_html || ''}
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- License Info -->
                    <div class="space-y-4">
                        <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">License Details</h4>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Category</label>
                                <select name="category" class="form-input" required>
                                    <option value="Academic" ${data.category === 'Academic' ? 'selected' : ''}>Academic</option>
                                    <option value="Government" ${data.category === 'Government' ? 'selected' : ''}>Government</option>
                                    <option value="Consultancy" ${data.category === 'Consultancy' ? 'selected' : ''}>Consultancy</option>
                                </select>
                            </div>
                            <div>
                                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Type</label>
                                <select name="type" class="form-input" required onchange="ui.licenses.onTypeChange(this.value)">
                                    <option value="New" ${data.type === 'New' ? 'selected' : ''}>New</option>
                                    <option value="Renewal" ${data.type === 'Renewal' ? 'selected' : ''}>Renewal</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Software Name</label>
                            <input type="text" name="software_name" value="${data.software_name || ''}" class="form-input" placeholder="e.g. AquaChem, AermodView" list="software-list">
                            <datalist id="software-list">
                                <option value="AquaChem">
                                <option value="AermodView">
                                <option value="AquiferTest">
                                <option value="Visual MODFLOW Flex">
                                <option value="Hydro GeoAnalyst">
                                <option value="GW Apps">
                                <option value="Breeze AERMOD">
                                <option value="Breeze ROADS">
                                <option value="Breeze HAZ">
                                <option value="AustalView">
                                <option value="CALPUFFView">
                                <option value="EcoView">
                                <option value="WRPLOT View">
                                <option value="Screen View">
                                <option value="SLAB View">
                                <option value="Shoreline View">
                                </datalist>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Serial Number <span class="text-red-500">*</span></label>
                                <input type="text" name="serial_number" value="${data.serial_number || ''}" required class="form-input font-mono" placeholder="Unique Serial #">
                            </div>
                            <div>
                                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Activation Key</label>
                                <input type="text" name="activation_key" value="${data.activation_key || ''}" class="form-input font-mono" placeholder="Key if any">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Dates -->
                    <div class="space-y-4">
                        <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Validity Period</h4>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Start Date</label>
                                <input type="date" name="start_date" value="${data.start_date || ''}" class="form-input">
                            </div>
                            <div>
                                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">End Date <span class="text-red-500">*</span></label>
                                <input type="date" name="end_date" value="${data.end_date || ''}" required class="form-input" onchange="ui.licenses.updatePreviewStatus(this.value)">
                            </div>
                        </div>
                        <div id="lic-status-preview" class="p-4 rounded-xl border flex items-center justify-between">
                            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculated Status</span>
                            <span id="lic-status-badge" class="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Awaiting Date</span>
                        </div>
                    </div>

                    <!-- Renewal & Notes -->
                    <div class="space-y-4">
                        <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Additional Info</h4>
                        <div id="renewal-link-container" class="${data.type === 'Renewal' ? '' : 'hidden'}">
                            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Link to Previous License</label>
                            <select name="previous_license_id" class="form-input">
                                <option value="">Select Record...</option>
                                ${state.licenses.map(l => `<option value="${l.id}" ${data.previous_license_id === l.id ? 'selected' : ''}>${l.software_name} (${l.serial_number})</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Notes / Remarks</label>
                            <textarea name="notes" class="form-input h-20 resize-none" placeholder="Enter remarks...">${data.notes || ''}</textarea>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end gap-3 pt-6 border-t font-bold">
                    <button type="button" onclick="ui.modal.close()" class="px-6 py-2 text-slate-500 hover:text-slate-700">Cancel</button>
                    <button type="submit" class="bg-slate-900 text-white px-8 py-2 rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-200">Save License Record</button>
                </div>
            </form>
        </div>
        `,
    };

    // --- Rendering Engine ---
    const render = () => {
        try {
            if (!state.user) return;

            // Sync Financial Year dropdown
            if (el.fySelect) el.fySelect.value = state.fy;

            // Update Title & Navigation
            const titles = {
                dashboard: 'Financial Overview',
                products: 'Catalog Master',
                customers: 'Customer Directory',
                invoices: 'Tax Invoices',
                credit_notes: 'Credit Notes',
                einvoices: 'E-Invoicing Console',
                subscriptions: 'Subscription Billing',
                quotations: 'Quotations+',
                proforma: 'Pro Forma Invoices',
                challans: 'Delivery Challans',
                purchases: 'Purchase Register',
                purchase_orders: 'Purchase Orders',
                debit_notes: 'Debit Notes',
                debit_notes: 'Debit Notes',
                reports: 'GST Filing Reports',
                settings: 'System Settings'
            };
            el.viewTitle.textContent = titles[state.view] || 'Laga Suite';

            document.querySelectorAll('.nav-link').forEach(link => {
                if (link.getAttribute('href') === '#' + state.view) {
                    link.classList.add('bg-slate-800', 'text-white', 'font-bold');
                    link.classList.remove('text-slate-400');
                } else {
                    link.classList.remove('bg-slate-800', 'text-white', 'font-bold');
                    link.classList.add('text-slate-400');
                }
            });

            // Render View
            switch (state.view) {
                case 'dashboard':
                    el.viewContainer.innerHTML = Templates.Dashboard({
                        sales: state.reports.sales.taxable + state.reports.sales.tax,
                        tax: state.reports.sales.tax,
                        itc: state.reports.purchases.tax
                    });
                    break;
                case 'products':
                    let products = state.products;
                    if (ui.products.searchQuery) {
                        const q = ui.products.searchQuery.toLowerCase();
                        products = products.filter(p =>
                            (p.name && p.name.toLowerCase().includes(q)) ||
                            (p.type && p.type.toLowerCase().includes(q)) ||
                            (p.hsn && p.hsn.toLowerCase().includes(q))
                        );
                    }
                    el.viewContainer.innerHTML = Templates.Products(products, ui.products.filter);
                    break;
                case 'customers':
                    let customers = state.customers;
                    if (ui.customers.searchQuery) {
                        const q = ui.customers.searchQuery.toLowerCase();
                        customers = customers.filter(c =>
                            (c.name && c.name.toLowerCase().includes(q)) ||
                            (c.gstin && c.gstin.toLowerCase().includes(q)) ||
                            (c.contact_name && c.contact_name.toLowerCase().includes(q)) ||
                            (c.contact_mobile && c.contact_mobile.includes(q)) ||
                            (c.contact_email && c.contact_email.toLowerCase().includes(q)) ||
                            (c.email && c.email.toLowerCase().includes(q)) ||
                            (c.city && c.city.toLowerCase().includes(q))
                        );
                    }
                    el.viewContainer.innerHTML = Templates.Customers(customers, ui.customers.filter);
                    break;
                case 'invoices':
                    el.viewContainer.innerHTML = Templates.Invoices(state.invoices, ui.sales.filter);
                    break;
                case 'credit_notes':
                    el.viewContainer.innerHTML = Templates.DocList('credit_notes', state.credit_notes);
                    break;
                case 'purchase_orders':
                    el.viewContainer.innerHTML = Templates.DocList('purchase_orders', state.purchase_orders);
                    break;
                case 'debit_notes':
                    el.viewContainer.innerHTML = Templates.DocList('debit_notes', state.debit_notes);
                    break;
                case 'quotations':
                    el.viewContainer.innerHTML = Templates.Quotations(state.quotations, ui.quotations.filter);
                    break;
                case 'proforma':
                    el.viewContainer.innerHTML = Templates.ProForma(state.proforma, ui.proforma.filter);
                    break;
                case 'reports':
                    el.viewContainer.innerHTML = Templates.Reports(state.reports);
                    break;
                case 'settings':
                    el.viewContainer.innerHTML = Templates.Settings(state.settings || {});
                    // Initialize checks/previews if needed
                    break;
                case 'challans':
                    el.viewContainer.innerHTML = Templates.Challans(state.challans, ui.challans.filter);
                    break;
                case 'purchases':
                    el.viewContainer.innerHTML = Templates.Purchases(state.purchases, ui.purchases.filter);
                    break;
                case 'licenses':
                    el.viewContainer.innerHTML = Templates.Licenses(state.licenses, ui.licenses.filters);
                    break;
                default:
                    el.viewContainer.innerHTML = `<div class="p-12 text-center text-slate-400 italic">This module is being initialized...</div>`;
            }
        } catch (err) {
            console.error('Render Error:', err);
            if (el.viewContainer) {
                el.viewContainer.innerHTML = `
                <div class="p-12 text-center text-red-500 bg-red-50 rounded-2xl border border-red-100 m-6">
                    <div class="text-3xl mb-4">⚠️</div>
                    <h3 class="font-bold">System Display Error</h3>
                    <p class="text-sm opacity-75 mt-2">${err.message}</p>
                    <button onclick="location.reload()" class="mt-6 bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-bold">Refresh Application</button>
                </div>
            `;
            }
        }
    };

    const isWithinFY = (dateStr, fy) => {
        try {
            if (!dateStr || !fy) return true;
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return true; // Graceful fallback

            const [startYear, endYearSuffix] = fy.split('-');
            const start = new Date(`${startYear}-04-01`);
            const end = new Date(`20${endYearSuffix}-03-31T23:59:59`);
            return date >= start && date <= end;
        } catch (e) {
            console.warn('FY Filter Error:', e);
            return true;
        }
    };

    // --- UI Helpers ---
    const ui = {
        customer: {
            copyBilling: () => {
                const form = document.getElementById('customer-form');
                if (document.getElementById('same-as-billing').checked) {
                    form.elements['shipping_country'].value = form.elements['billing_country'].value;
                    form.elements['shipping_address1'].value = form.elements['billing_address1'].value;
                    form.elements['shipping_address2'].value = form.elements['billing_address2'].value;
                    form.elements['shipping_city'].value = form.elements['billing_city'].value;
                    form.elements['shipping_state'].value = form.elements['state'].value;
                    form.elements['shipping_pincode'].value = form.elements['billing_pincode'].value;
                }
            },
            updateShippingTitle: () => {
                const name = document.getElementsByName('name')[0].value;
                const shippingTitle = document.getElementsByName('shipping_title')[0];
                if (shippingTitle && !shippingTitle.value) {
                    shippingTitle.value = name;
                }
            },
            addContact: () => {
                const container = document.getElementById('additional-contacts-list');
                const id = Date.now().toString() + Math.floor(Math.random() * 1000);
                const div = document.createElement('div');
                div.className = 'grid grid-cols-4 gap-4 items-start relative bg-slate-50 p-4 rounded-xl';
                div.id = `contact-${id}`;
                div.innerHTML = `
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Name</label>
                        <input type="text" name="extra_contact_name_${id}" class="form-input bg-white" placeholder="Name">
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Mobile</label>
                        <input type="tel" name="extra_contact_mobile_${id}" class="form-input bg-white" placeholder="Mobile">
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Email</label>
                        <input type="email" name="extra_contact_email_${id}" class="form-input bg-white" placeholder="Email">
                    </div>
                    <div class="relative">
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Designation</label>
                        <input type="text" name="extra_contact_role_${id}" class="form-input bg-white" placeholder="Role">
                        <button type="button" onclick="ui.customer.removeContact('${id}')" class="absolute -top-1 -right-1 bg-red-100 text-red-500 rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-200">×</button>
                    </div>
                `;
                container.appendChild(div);
                return id;
            },
            removeContact: (id) => {
                const el = document.getElementById(`contact-${id}`);
                if (el) el.remove();
            },
            save: async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());

                // Cleanup empty IDs
                if (!data.id) delete data.id;

                // Process Additional Contacts
                const contacts = [];
                const extraKeys = Object.keys(data).filter(k => k.startsWith('extra_contact_name_'));

                extraKeys.forEach(key => {
                    const id = key.split('_').pop();
                    if (data[`extra_contact_name_${id}`]) {
                        contacts.push({
                            name: data[`extra_contact_name_${id}`],
                            mobile: data[`extra_contact_mobile_${id}`],
                            email: data[`extra_contact_email_${id}`],
                            role: data[`extra_contact_role_${id}`]
                        });
                    }
                    // Clean up temp fields
                    delete data[`extra_contact_name_${id}`];
                    delete data[`extra_contact_mobile_${id}`];
                    delete data[`extra_contact_email_${id}`];
                    delete data[`extra_contact_role_${id}`];
                });

                if (contacts.length > 0) {
                    data.contacts = contacts;
                }

                // Add Meta
                data.user_id = state.user.id;

                try {
                    const { error } = await supabaseClient.from('customers').upsert(data);
                    if (error) throw error;
                    ui.modal.close();
                    await api.masters.fetch(); // Helper to refresh master lists
                    api.notifications.show('Customer saved successfully');
                } catch (err) {
                    console.error('Save Error:', err);
                    alert('Save Failed: ' + err.message);
                }
            },
            view: (id) => {
                const customer = state.customers.find(c => c.id === id);
                if (customer) {
                    ui.modal.open('customer-view', customer);
                }
            },
            delete: async (id) => {
                if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
                    try {
                        const { error } = await supabaseClient.from('customers').delete().eq('id', id);
                        if (error) throw error;
                        ui.modal.close();
                        await api.masters.fetch();
                        api.notifications.show('Customer deleted successfully');
                    } catch (err) {
                        alert('Delete Failed: ' + err.message);
                    }
                }
            }
        },
        modal: {
            open: (type, data) => {
                const overlay = document.getElementById('modal-overlay');
                const root = document.getElementById('modal-root');
                overlay.classList.add('active');

                if (type === 'quotation-new') {
                    ui.quotation_v2.activeId = null;
                    ui.quotation_v2.activeStatus = null;
                }

                if (type === 'proforma-new') {
                    ui.proforma_v2.activeId = null;
                    ui.proforma_v2.activeStatus = null;
                }


                if (type === 'product') {
                    root.innerHTML = `
                        <div class="modal-content bg-white p-8 rounded-3xl w-full max-w-md animate-slide-up">
                            <h3 class="text-xl font-bold text-slate-900 mb-6 font-display">Add Product/Service</h3>
                            <form id="product-form" class="space-y-4">
                                <input type="hidden" name="id" id="field-id">
                                <div><label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item Name</label><input type="text" name="name" class="form-input" required placeholder="e.g. Industrial Sensor"></div>
                                <div class="grid grid-cols-3 gap-4">
                                    <div><label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">HSN/SAC</label><input type="text" name="hsn" class="form-input" required placeholder="8525"></div>
                                    <div><label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base Price</label><input type="number" name="price" step="0.01" class="form-input" required placeholder="0.00"></div>
                                    <div>
                                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Currency</label>
                                        <select name="currency" class="form-input">
                                            <option value="INR" selected>INR (₹)</option>
                                            <option value="USD">USD ($)</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div><label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GST Rate (%)</label>
                                        <select name="gst" class="form-input" required>
                                            <option value="0">0% (Nil Rated)</option>
                                            <option value="5">5%</option>
                                            <option value="12">12%</option>
                                            <option value="18" selected>18%</option>
                                            <option value="28">28%</option>
                                            <option value="40">40%</option>
                                        </select>
                                    </div>
                                    <div><label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</label>
                                        <select name="type" class="form-input">
                                            <option value="PRODUCT">PRODUCT</option>
                                            <option value="SERVICE">SERVICE</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="flex justify-end gap-3 pt-6">
                                    <button type="button" onclick="ui.modal.close()" class="px-6 py-2 text-slate-500 font-medium hover:text-slate-700 transition-colors">Cancel</button>
                                    <button type="submit" class="btn-primary">Save Changes</button>
                                </div>
                            </form>
                        </div>
    `;
                    document.getElementById('product-form').onsubmit = e => api.masters.save('products', e);
                } else if (type === 'customer') {
                    root.innerHTML = `
                        <div class="modal-content bg-white p-8 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-slide-up">
                            <h3 class="text-2xl font-bold text-slate-900 mb-8 font-display">Add Contact/Customer</h3>
                            <form id="customer-form" class="space-y-8">
                                <input type="hidden" name="id" id="field-id">
                                
                                <!-- Company Details -->
                                <div class="space-y-4">
                                    <h4 class="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Company Details</h4>
                                    <div class="grid grid-cols-2 gap-6">
                                        <div>
                                            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Company Name <span class="text-red-500">*</span></label>
                                            <input type="text" name="name" class="form-input" required placeholder="Company Name" oninput="ui.customer.updateShippingTitle()">
                                        </div>
                                        <div>
                                            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">GSTIN</label>
                                            <input type="text" name="gstin" class="form-input" placeholder="GSTIN">
                                        </div>
                                        <div>
                                            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">PAN Number</label>
                                            <input type="text" name="pan_no" class="form-input" placeholder="PAN Number">
                                        </div>
                                    </div>
                                </div>

                                <!-- Contact Person -->
                                <div class="space-y-4">
                                    <h4 class="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Primary Contact Person</h4>
                                    <div class="grid grid-cols-4 gap-4">
                                        <div class="col-span-1">
                                            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Name</label>
                                            <input type="text" name="contact_name" class="form-input" placeholder="Name">
                                        </div>
                                        <div>
                                            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Mobile No</label>
                                            <input type="tel" name="contact_mobile" class="form-input" placeholder="Mobile No">
                                        </div>
                                        <div>
                                            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Phone No</label>
                                            <input type="tel" name="contact_phone" class="form-input" placeholder="Phone No">
                                        </div>
                                        <div>
                                            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Email</label>
                                            <input type="email" name="contact_email" class="form-input" placeholder="Email Address">
                                        </div>
                                    </div>
                                </div>

                                <!-- Additional Contacts -->
                                <div class="space-y-4">
                                    <div class="flex justify-between items-center border-b border-slate-100 pb-2">
                                        <h4 class="text-sm font-bold text-slate-900">Additional Contacts</h4>
                                        <button type="button" onclick="ui.customer.addContact()" class="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1">
                                            <span class="text-lg leading-none">+</span> Add Person
                                        </button>
                                    </div>
                                    <div id="additional-contacts-list" class="space-y-3">
                                        <!-- Dynamic Rows -->
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 gap-12">
                                    <!-- Billing Address -->
                                    <div class="space-y-4">
                                        <h4 class="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Billing Address</h4>
                                        <div class="space-y-4">
                                            <div>
                                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Country</label>
                                                <select name="billing_country" class="form-input">
                                                    ${Constants.Countries.map(c => `<option value="${c}" ${c === 'India' ? 'selected' : ''}>${c}</option>`).join('')}
                                                </select>
                                            </div>
                                            <div>
                                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Address Line 1 <span class="text-red-500">*</span></label>
                                                <input type="text" name="billing_address1" class="form-input" required placeholder="Street, Building">
                                            </div>
                                            <div>
                                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Address Line 2</label>
                                                <input type="text" name="billing_address2" class="form-input" placeholder="Area, Landmark">
                                            </div>
                                            <div class="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">City</label>
                                                    <input type="text" name="billing_city" class="form-input">
                                                </div>
                                                <div>
                                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Pincode</label>
                                                    <input type="text" name="billing_pincode" class="form-input">
                                                </div>
                                            </div>
                                            <div>
                                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">State</label>
                                                <select name="state" class="form-input">
                                                    <option value="">Select State...</option>
                                                    ${Constants.States.map(s => `<option value="${s.code}">${s.name}</option>`).join('')}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Shipping Address -->
                                    <div class="space-y-4">
                                        <div class="flex justify-between items-center border-b border-slate-100 pb-2">
                                            <h4 class="text-sm font-bold text-slate-900">Shipping Address</h4>
                                            <label class="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" id="same-as-billing" class="rounded text-blue-600 focus:ring-blue-500" onchange="ui.customer.copyBilling()">
                                                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Same as Billing</span>
                                            </label>
                                        </div>
                                        <div class="space-y-4">
                                            <div>
                                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Title</label>
                                                <input type="text" name="shipping_title" class="form-input bg-slate-50" placeholder="Auto-filled from Company Name">
                                            </div>
                                            <div>
                                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Country</label>
                                                <select name="shipping_country" class="form-input">
                                                    ${Constants.Countries.map(c => `<option value="${c}" ${c === 'India' ? 'selected' : ''}>${c}</option>`).join('')}
                                                </select>
                                            </div>
                                            <div>
                                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Address Line 1 <span class="text-red-500">*</span></label>
                                                <input type="text" name="shipping_address1" class="form-input" required placeholder="Street, Building">
                                            </div>
                                            <div>
                                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Address Line 2</label>
                                                <input type="text" name="shipping_address2" class="form-input" placeholder="Area, Landmark">
                                            </div>
                                            <div class="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">City</label>
                                                    <input type="text" name="shipping_city" class="form-input">
                                                </div>
                                                <div>
                                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Pincode</label>
                                                    <input type="text" name="shipping_pincode" class="form-input">
                                                </div>
                                            </div>
                                            <div>
                                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">State</label>
                                                <select name="shipping_state" class="form-input">
                                                    <option value="">Select State...</option>
                                                    ${Constants.States.map(s => `<option value="${s.code}">${s.name}</option>`).join('')}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="flex justify-end gap-3 pt-6 border-t border-slate-100">
                                    <button type="button" onclick="ui.modal.close()" class="px-6 py-2 text-slate-500 font-medium hover:text-slate-700 transition-colors">Cancel</button>
                                    <button type="submit" class="btn-primary">Save Contact</button>
                                </div>
                            </form>
                        </div>
    `;
                    document.getElementById('customer-form').onsubmit = e => ui.customer.save(e);
                } else if (type === 'customer-view') {
                    // Start Customer View Modal
                    // data is passed as the second argument to open(type, data)
                    const c = data || {};

                    const billingState = Constants.States.find(s => s.code === c.state)?.name || c.state || '-';
                    const shippingState = Constants.States.find(s => s.code === c.shipping_state)?.name || c.shipping_state || '-';

                    const contactsList = c.contacts && Array.isArray(c.contacts) ? c.contacts.map(contact => `
                        <div class="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div class="font-bold text-slate-900">${contact.name}</div>
                            <div class="text-xs text-slate-500">${contact.role || 'No Role'}</div>
                            <div class="mt-2 text-xs space-y-1">
                                <div class="flex items-center gap-2"><svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a2 2 0 011.917 1.285l1.257 3.771a2 2 0 01-1.917 2.715H9.196a11.722 11.722 0 005.093 5.093v-1.114a2 2 0 012.715-1.917l3.771 1.257c.54.18.917.684.917 1.257V21a2 2 0 01-2 2h-1c-10.493 0-19-8.507-19-19V5z"></path></svg> ${contact.mobile || '-'}</div>
                                <div class="flex items-center gap-2"><svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg> ${contact.email || '-'}</div>
                            </div>
                        </div>
                    `).join('') : '<div class="text-slate-400 italic text-sm">No additional contacts.</div>';

                    root.innerHTML = `
                        <div class="modal-content bg-white p-8 rounded-3xl w-full max-w-4xl relative animate-slide-up max-h-[90vh] overflow-y-auto">
                            <button onclick="ui.modal.close()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                            
                            <div class="flex items-start justify-between mb-8 border-b border-slate-100 pb-6">
                                <div>
                                    <div class="flex items-center gap-3">
                                        <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold text-xl">
                                            ${c.name ? c.name.substring(0, 2).toUpperCase() : '??'}
                                        </div>
                                        <div>
                                            <h2 class="text-2xl font-bold text-slate-900">${c.name}</h2>
                                            <div class="flex items-center gap-2 mt-1">
                                                <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">GSTIN: ${c.gstin || 'N/A'}</span>
                                                <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">PAN: ${c.pan_no || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="flex gap-3">
                                    <button onclick="ui.customer.delete('${c.id}')" class="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 text-sm transition-colors border border-red-100">Delete</button>
                                    <button onclick="ui.modal.edit('customer', '${c.id}')" class="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 text-sm transition-colors shadow-lg shadow-blue-200">Edit Details</button>
                                </div>
                            </div>

                            <div class="grid grid-cols-3 gap-8">
                                <div class="col-span-2 space-y-8">
                                    <!-- Primary Contact -->
                                    <div>
                                        <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                            Primary Contact
                                        </h4>
                                        <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-4">
                                            <div>
                                                <label class="text-[10px] text-slate-400 font-bold uppercase">Name</label>
                                                <div class="text-slate-900 font-medium">${c.contact_name || '-'}</div>
                                            </div>
                                            <div>
                                                <label class="text-[10px] text-slate-400 font-bold uppercase">Mobile</label>
                                                <div class="text-slate-900 font-medium">${c.contact_mobile || '-'}</div>
                                            </div>
                                            <div>
                                                <label class="text-[10px] text-slate-400 font-bold uppercase">Email</label>
                                                <div class="text-slate-900 font-medium">${c.contact_email || '-'}</div>
                                            </div>
                                            <div>
                                                <label class="text-[10px] text-slate-400 font-bold uppercase">Phone</label>
                                                <div class="text-slate-900 font-medium">${c.contact_phone || '-'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Addresses -->
                                    <div class="grid grid-cols-2 gap-6">
                                        <div>
                                            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                                Billing Address
                                            </h4>
                                            <div class="p-4 rounded-xl border border-slate-100 h-full text-sm text-slate-600 leading-relaxed">
                                                <div class="font-bold text-slate-900 mb-1">${c.name}</div>
                                                ${c.billing_address1 || ''}<br>
                                                ${c.billing_address2 ? c.billing_address2 + '<br>' : ''}
                                                ${c.billing_city} - ${c.billing_pincode}<br>
                                                ${billingState}, ${c.billing_country || 'India'}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
                                                Shipping Address
                                            </h4>
                                            <div class="p-4 rounded-xl border border-slate-100 h-full text-sm text-slate-600 leading-relaxed">
                                                <div class="font-bold text-slate-900 mb-1">${c.shipping_title || c.name}</div>
                                                ${c.shipping_address1 || ''}<br>
                                                ${c.shipping_address2 ? c.shipping_address2 + '<br>' : ''}
                                                ${c.shipping_city} - ${c.shipping_pincode}<br>
                                                ${shippingState}, ${c.shipping_country || 'India'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Sidebar: Additional Contacts -->
                                <div>
                                    <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                        Team & Contacts
                                    </h4>
                                    <div class="space-y-3">
                                        ${contactsList}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                } else if (type === 'invoice') {
                    const today = new Date().toISOString().split('T')[0];
                    root.innerHTML = `
                <div class="modal-content p-0 w-full max-w-[98vw] h-[98vh] overflow-hidden flex flex-col bg-slate-50 border-none rounded-none">
                    <!-- Builder Top Bar -->
                    <div class="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shrink-0">
                        <div class="flex items-center gap-3">
                            <span class="text-xs font-bold text-slate-800 uppercase tracking-widest">Create Tax Invoice</span>
                        </div>
                        <div class="flex items-center gap-4">
                            <button onclick="ui.modal.close()" class="p-1.5 text-slate-400 hover:text-slate-900 transition-colors">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                    </div>

                    <!-- Builder Body -->
                    <div class="flex-1 overflow-y-auto builder-container">
                        <!-- Section 1: Customer & Header Meta -->
                        <div class="builder-section grid grid-cols-12 gap-0 border-b-2">
                            <div class="col-span-12 lg:col-span-3 pr-8">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Select Customer</label>
                                <div class="customer-search-container">
                                    <input type="text" id="inv-customer-search" 
                                           class="w-full text-lg font-black bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-300" 
                                           placeholder="Type customer name..." 
                                           oninput="ui.invoice.filterCustomers(this.value)"
                                           autocomplete="off">
                                    <input type="hidden" id="inv-customer">
                                    <div id="inv-customer-results" class="customer-results-list hidden"></div>
                                </div>
                                <div class="mt-4 flex gap-4">
                                    <button onclick="ui.modal.open('customer')" class="text-xs font-bold text-accent">+ Create Customer</button>
                                </div>
                            </div>
                            
                            <div class="col-span-12 lg:col-span-9 flex border-l border-slate-100 pl-8 gap-8">
                                <div class="builder-header-field flex-1">
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Invoice #</label>
                                    <div class="flex items-center gap-2">
                                        <input type="text" id="inv-no" class="text-sm font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0 w-52" readonly>
                                        <input type="date" id="inv-date" value="${today}" class="text-sm font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:ring-0" placeholder="Invoice Date">
                                    </div>
                                </div>
                                <div class="builder-header-field flex-1">
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Transaction Type</label>
                                    <select id="inv-type" class="text-sm font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0 w-full" onchange="ui.invoice.toggleExportFields(); ui.invoice.updateCalculations();">
                                        <option value="Regular">Regular (GST)</option>
                                        <option value="Without GST">Without GST</option>
                                        <option value="LUT / Export">LUT / Export</option>
                                    </select>
                                </div>
                                <div class="builder-header-field flex-1">
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Due Date</label>
                                    <input type="date" id="inv-due-date" class="text-sm font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0">
                                </div>
                            </div>
                        </div>

                        <!-- Section 2: Purchase Details & Custom Fields -->
                        <div class="builder-section bg-slate-50/50 py-6 border-b-2">
                            <div class="grid grid-cols-12 gap-8">
                                <div class="col-span-12 lg:col-span-4 border-r border-slate-200 pr-8">
                                    <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Customer PO / Reference</h4>
                                    <div class="grid grid-cols-2 gap-4">
                                        <div>
                                            <label class="text-[10px] font-bold text-slate-400 block mb-1">PO Number</label>
                                            <input type="text" id="inv-purchase-no" class="form-input text-sm font-bold bg-white border-slate-200 rounded-lg w-full" placeholder="PO-123">
                                        </div>
                                        <div>
                                            <label class="text-[10px] font-bold text-slate-400 block mb-1">PO Date</label>
                                            <input type="date" id="inv-purchase-date" class="form-input text-sm font-bold bg-white border-slate-200 rounded-lg w-full">
                                        </div>
                                    </div>
                                </div>
                                <div class="col-span-12 lg:col-span-8">
                                    <div class="flex items-center justify-between mb-4">
                                        <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custom Metadata</h4>
                                        <button onclick="ui.invoice.addCustomField()" class="text-[10px] font-black text-accent uppercase tracking-widest hover:text-blue-700 transition-colors flex items-center gap-1">
                                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                                            Add Custom Field
                                        </button>
                                    </div>
                                    <div id="inv-custom-fields" class="grid grid-cols-2 gap-x-8 gap-y-4">
                                        <!-- Custom fields injected here -->
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Section 2.7: Export & Currency Details (Conditional) -->
                        <div id="inv-export-fields" class="hidden builder-section bg-orange-50/20 py-4 border-b-2 border-orange-100">
                             <div class="grid grid-cols-3 gap-6">
                                <div>
                                    <label class="text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-2">Supply Country</label>
                                    <select id="inv-country" class="form-input text-sm font-bold bg-white border-orange-100 rounded-lg w-full">
                                        ${Constants.Countries.map(c => `<option value="${c}" ${c === 'India' ? 'selected' : ''}>${c}</option>`).join('')}
                                    </select>
                                </div>
                                <div>
                                    <label class="text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-2">Currency</label>
                                    <select id="inv-currency" class="form-input text-sm font-bold bg-white border-orange-100 rounded-lg w-full" onchange="ui.invoice.updateCalculations()">
                                        <option value="INR" selected>INR (₹)</option>
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-1">Exchange Rate</label>
                                    <input type="number" id="inv-exchange-rate" step="0.0001" value="1.00" class="form-input text-sm font-bold bg-white border-orange-100 rounded-lg w-full" oninput="ui.invoice.updateCalculations()">
                                </div>
                            </div>
                        </div>

                        <!-- Section 3.5: Delivery & Payment Terms -->
                        <div class="builder-section bg-white py-4 border-b-2">
                            <div class="grid grid-cols-3 gap-6">
                                <div>
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Payment Terms</label>
                                    <input type="text" id="inv-payment-terms" class="form-input text-sm font-bold bg-slate-50 border-slate-200 rounded-lg w-full" placeholder="e.g., 100% Advance">
                                </div>
                                <div>
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Delivery Time</label>
                                    <input type="text" id="inv-delivery-time" class="form-input text-sm font-bold bg-slate-50 border-slate-200 rounded-lg w-full" placeholder="e.g., 2-3 weeks">
                                </div>
                                <div>
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Delivery Mode</label>
                                    <input type="text" id="inv-delivery-mode" class="form-input text-sm font-bold bg-slate-50 border-slate-200 rounded-lg w-full" placeholder="e.g., By Road">
                                </div>
                            </div>
                        </div>

                        <!-- Section 3: Products & Services -->
                        <div class="builder-section">
                            <div class="flex items-center justify-between mb-8">
                                <h4 class="text-sm font-black text-slate-900 uppercase tracking-widest">Line Items</h4>
                                <button onclick="ui.invoice.addItem()" class="text-xs font-bold text-accent flex items-center gap-2">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                    Add Item
                                </button>
                            </div>

                            <div class="border border-slate-200 rounded-xl overflow-hidden min-h-[300px] flex flex-col">
                                <table class="builder-table">
                                    <thead>
                                        <tr>
                                            <th class="text-left">Product Name</th>
                                            <th class="text-left w-24">HSN/SAC</th>
                                            <th class="text-center w-28">Quantity</th>
                                            <th class="text-left w-32">Unit Price</th>
                                            <th class="text-center w-24">Disc %</th>
                                            <th class="text-left w-32">Price with Tax</th>
                                            <th class="text-right w-40">Amount</th>
                                            <th class="w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody id="inv-line-items" class="bg-white">
                                        <!-- Items will be injected here -->
                                    </tbody>
                                </table>
                                
                                <div id="inv-empty-state" class="flex-1 flex flex-col items-center justify-center py-20 bg-slate-50/30">
                                    <div class="bg-white p-6 rounded-full shadow-sm mb-4">
                                        <svg class="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                                    </div>
                                    <p class="text-sm font-bold text-slate-400">Search products to add items to your invoice 🚀</p>
                                    <button onclick="ui.invoice.addItem()" class="mt-6 bg-accent text-white px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider">+ Add Item</button>
                                </div>
                            </div>
                        </div>


                        <!-- Section 4: Notes & Bank -->
                        <div class="grid grid-cols-12 gap-0 border-t border-slate-200">
                            <div class="col-span-12 lg:col-span-6 border-r border-slate-200 p-8 space-y-10">
                                <div>
                                    <div class="border border-slate-200 rounded-xl overflow-hidden bg-white">
                                        <div class="flex items-center justify-between bg-slate-50 px-4 py-2 border-b border-slate-200">
                                            <span class="text-xs font-black text-slate-900 border-b-2 border-accent pb-1">Notes & Terms</span>
                                            <button onclick="ui.invoice.loadDefaultTerms()" class="text-[9px] font-bold text-slate-500 uppercase underline">Load Default</button>
                                        </div>
                                        <div class="p-4">
                                            <textarea id="inv-notes" class="w-full min-h-[120px] border-none focus:ring-0 text-sm p-0" placeholder="Enter notes..."></textarea>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Select Bank Account</label>
                                    <select id="inv-bank" class="form-input text-sm font-bold bg-white border-slate-200 rounded-xl w-full">
                                        <option value="inr">${(state.settings && state.settings.bank_inr_name) || 'Domestic (INR)'} - ${(state.settings && state.settings.bank_inr_acc_no) || ''}</option>
                                        <option value="usd">${(state.settings && state.settings.bank_usd_name) || 'International (USD)'} - ${(state.settings && state.settings.bank_usd_acc_no) || ''}</option>
                                    </select>
                                </div>
                            </div>

                            <div class="col-span-12 lg:col-span-6 bg-slate-50/30 p-8">
                                <div class="col-start-2 space-y-4 max-w-sm ml-auto">
                                    <div class="flex justify-between items-center text-xs font-bold">
                                        <span class="text-slate-400">Taxable Amount</span>
                                        <span id="inv-sum-taxable" class="text-slate-900">₹0.00</span>
                                    </div>
                                    <div id="inv-tax-rows" class="space-y-4">
                                        <!-- Dynamic tax rows -->
                                    </div>
                                     <div id="inv-bank-charges-container" class="flex justify-between items-center text-xs font-bold pt-2 border-t border-slate-100 hidden">
                                         <span class="text-slate-400">Bank Charges</span>
                                         <input type="number" id="inv-bank-charges" step="0.01" value="0.00" class="text-right text-slate-900 bg-transparent border-none p-0 focus:ring-0 w-24 font-bold" oninput="ui.invoice.updateCalculations()">
                                     </div>
                                    <div class="flex justify-between items-center pt-4 border-t border-slate-200">
                                        <span class="text-lg font-black text-slate-900">Grand Total</span>
                                        <span id="inv-sum-total" class="text-2xl font-black text-accent tabular-nums">₹0.00</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Builder Sticky Footer -->
                    <div class="modal-footer-sticky bg-white border-t border-slate-200 py-3 px-6 shadow-2xl flex justify-between items-center shrink-0">
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total:</span>
                            <span id="inv-footer-total" class="text-sm font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">₹0.00</span>
                        </div>
                        <div class="flex gap-3">
                            <button onclick="ui.modal.close()" class="px-6 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-slate-100 transition-all">Discard</button>
                            <button onclick="api.invoices.save(true)" class="px-6 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-slate-100 transition-all">Save as Draft</button>
                            <button onclick="api.invoices.save(false, true)" class="px-6 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-slate-100 transition-all">Save & Print</button>
                            <button onclick="api.invoices.save(false)" class="px-8 py-2 bg-blue-600 text-white rounded-lg text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30">
                                Save Invoice
                            </button>
                        </div>
                    </div>
                </div>
                `;
                    ui.invoice.updateDocNo(); // Initial doc no
                    ui.invoice.addItem();
                    ui.invoice.loadDefaultTerms();
                } else if (type === 'purchase') {
                    root.innerHTML = `
                        <div class="modal-content p-8 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slide-up bg-white">
                            <div class="flex justify-between items-center mb-8">
                                <h3 class="text-2xl font-bold text-slate-900 font-display">New Purchase Bill (ITC)</h3>
                                <div class="text-right">
                                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Billing Date</p>
                                    <input type="date" id="pur-date" class="border-0 font-bold text-slate-900 outline-none" value="${new Date().toISOString().split('T')[0]}">
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-8 mb-8">
                                <div class="glass p-6 rounded-2xl bg-slate-50/50">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Vendor / Supplier</label>
                                    <select id="pur-vendor" class="form-input" onchange="ui.purchase.updateCalculations()">
                                        <option value="">Select Vendor...</option>
                                        ${state.customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="glass p-6 rounded-2xl bg-slate-50/50">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Vendor Bill No.</label>
                                    <input type="text" id="pur-no" class="form-input font-mono font-bold" placeholder="E.g. TAX-998">
                                </div>
                            </div>

                            <div class="mb-4">
                                <div class="line-item-row bg-slate-50 text-[10px] uppercase font-bold text-slate-400 px-4 rounded-t-xl border-b-0">
                                    <span>Item / Expense</span>
                                    <span>Qty</span>
                                    <span>Rate</span>
                                    <span class="text-right">Tax Value</span>
                                    <span></span>
                                </div>
                                <div id="pur-line-items" class="divide-y divide-slate-100 border-x border-b border-slate-100 rounded-b-xl px-4">
                                    <!-- Purchases items injected here -->
                                </div>
                                <button onclick="ui.purchase.addItem()" class="mt-4 text-orange-600 font-bold text-xs uppercase tracking-widest hover:text-orange-700 transition-colors">+ Add Item / Expense</button>
                            </div>

                            <div class="invoice-summary border-orange-100 bg-orange-50/20">
                                <div class="grid grid-cols-2 gap-12">
                                    <div class="text-xs text-slate-500 italic">
                                        Note: This will be added to your Input Tax Credit (ITC) for the current period.
                                    </div>
                                    <div class="space-y-2">
                                        <div class="summary-row"><span>Total Taxable Value</span><span id="pur-subtotal">₹0.00</span></div>
                                        <div class="summary-row text-orange-600 font-bold"><span>Total ITC (GST)</span><span id="pur-tax">₹0.00</span></div>
                                        <div class="summary-row total"><span>Total Payable</span><span id="pur-total">₹0.00</span></div>
                                    </div>
                                </div>
                            </div>

                            <div class="flex justify-end gap-3 pt-10">
                                <button type="button" onclick="ui.modal.close()" class="px-8 py-3 text-slate-500 font-medium hover:text-slate-700 transition-colors">Discard</button>
                                <button onclick="api.purchases.save()" class="bg-slate-900 text-white px-10 py-3 rounded-xl font-bold hover:bg-black transition-all shadow-xl">Complete Purchase</button>
                            </div>
                        </div>
                    `;
                    ui.purchase.addItem();
                } else if (type === 'quotation-new') {
                    const today = new Date().toISOString().split('T')[0];
                    const validityDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

                    root.innerHTML = `
                <div class="modal-content p-0 w-full max-w-[98vw] h-[98vh] overflow-hidden flex flex-col bg-slate-50 border-none rounded-none">
                    <!-- Builder Top Bar -->
                    <div class="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shrink-0">
                        <div class="flex items-center gap-3">
                            <span class="text-xs font-bold text-slate-800 uppercase tracking-widest">Create Quotation</span>
                        </div>
                        <div class="flex items-center gap-4">
                            <button onclick="ui.modal.close()" class="p-1.5 text-slate-400 hover:text-slate-900 transition-colors">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                    </div>

                    <!-- Builder Body -->
                    <div class="flex-1 overflow-y-auto builder-container">
                        <!-- Section 1: Customer & Header Meta -->
                        <div class="builder-section grid grid-cols-12 gap-0 border-b-2">
                            <div class="col-span-12 lg:col-span-3 pr-8">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Select Customer</label>
                                <div class="customer-search-container">
                                    <input type="text" id="qtn-customer-search" 
                                           class="w-full text-lg font-black bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-300" 
                                           placeholder="Type customer name..."
                                           oninput="ui.quotation_v2.filterCustomers(this.value)"
                                           autocomplete="off">
                                    <input type="hidden" id="qtn-customer">
                                    <div id="qtn-customer-results" class="customer-results-list hidden"></div>
                                </div>
                                <div class="mt-4 flex gap-4">
                                    <button onclick="ui.modal.open('customer')" class="text-xs font-bold text-accent">+ Create Customer</button>
                                </div>
                            </div>
                            
                            <div class="col-span-12 lg:col-span-9 flex border-l border-slate-100 pl-8 gap-8">
                                <div class="builder-header-field flex-1">
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Quotation #</label>
                                    <div class="flex items-center gap-2">
                                        <input type="text" id="qtn-no" class="text-sm font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0 w-52" readonly>
                                        <input type="date" id="qtn-date" value="${today}" class="text-sm font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:ring-0" onchange="ui.quotation_v2.updateDocNo()">
                                    </div>
                                </div>
                                <div class="builder-header-field flex-1">
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Transaction Type</label>
                                    <select id="qtn-type" class="text-sm font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0 w-full" onchange="ui.quotation_v2.toggleExportFields(); ui.quotation_v2.updateCalculations();">
                                        <option value="Regular">Regular (GST)</option>
                                        <option value="Without GST">Without GST</option>
                                        <option value="LUT / Export">LUT / Export</option>
                                    </select>
                                </div>
                                <div class="builder-header-field flex-1">
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Valid Until</label>
                                    <input type="date" id="qtn-validity" value="${validityDate}" class="text-sm font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0">
                                </div>
                            </div>
                        </div>

                        <!-- Section 2: Subject & Custom Fields -->
                        <div class="builder-section bg-slate-50/50 py-6 border-b-2">
                            <div class="grid grid-cols-12 gap-8">
                                <div class="col-span-12 lg:col-span-4 border-r border-slate-200 pr-8">
                                    <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Quotation Subject / Ref</h4>
                                    <div>
                                        <label class="text-[10px] font-bold text-slate-400 block mb-1">Subject / Reference</label>
                                        <input type="text" id="qtn-subject" class="form-input text-sm font-bold bg-white border-slate-200 rounded-lg w-full" placeholder="e.g. Supply of Industrial Equipment">
                                    </div>
                                </div>
                                <div class="col-span-12 lg:col-span-8">
                                    <div class="flex items-center justify-between mb-4">
                                        <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Additional Metadata (Custom Fields)</h4>
                                        <button onclick="ui.quotation_v2.addCustomField()" class="text-[10px] font-black text-accent uppercase tracking-widest hover:text-blue-700 transition-colors flex items-center gap-1">
                                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                                            Add Custom Field
                                        </button>
                                    </div>
                                    <div id="qtn-custom-fields" class="grid grid-cols-2 gap-x-8 gap-y-4">
                                        <!-- Custom fields injected here -->
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Section 2.7: Export & Currency Details (Conditional) -->
                        <div id="qtn-export-fields" class="hidden builder-section bg-orange-50/20 py-4 border-b-2 border-orange-100">
                             <div class="grid grid-cols-3 gap-6">
                                <div>
                                    <label class="text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-2">Supply Country</label>
                                    <select id="qtn-country" class="form-input text-sm font-bold bg-white border-orange-100 rounded-lg w-full">
                                        ${Constants.Countries.map(c => `<option value="${c}" ${c === 'India' ? 'selected' : ''}>${c}</option>`).join('')}
                                    </select>
                                </div>
                                <div>
                                    <label class="text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-2">Currency</label>
                                    <select id="qtn-currency" class="form-input text-sm font-bold bg-white border-orange-100 rounded-lg w-full" onchange="ui.quotation_v2.updateCalculations()">
                                        <option value="INR" selected>INR (₹)</option>
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-1">Exchange Rate</label>
                                    <input type="number" id="qtn-exchange-rate" step="0.0001" value="1.00" class="form-input text-sm font-bold bg-white border-orange-100 rounded-lg w-full" oninput="ui.quotation_v2.updateCalculations()">
                                </div>
                            </div>
                        </div>

                        <!-- Section 2.8: Delivery & Payment Terms -->
                        <div class="builder-section bg-white py-4 border-b-2">
                            <div class="grid grid-cols-3 gap-6">
                                <div>
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Payment Terms</label>
                                    <input type="text" id="qtn-payment-terms" class="form-input text-sm font-bold bg-slate-50 border-slate-200 rounded-lg w-full" placeholder="e.g., 100% Advance">
                                </div>
                                <div>
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Delivery Time</label>
                                    <input type="text" id="qtn-delivery-time" class="form-input text-sm font-bold bg-slate-50 border-slate-200 rounded-lg w-full" placeholder="e.g., 2-3 weeks">
                                </div>
                                <div>
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Delivery Mode</label>
                                    <input type="text" id="qtn-delivery-mode" class="form-input text-sm font-bold bg-slate-50 border-slate-200 rounded-lg w-full" placeholder="e.g., By Road">
                                </div>
                            </div>
                        </div>

                        <!-- Section 3: Products & Services -->
                        <div class="builder-section">
                            <div class="flex items-center justify-between mb-8">
                                <div class="flex items-center gap-6">
                                    <h4 class="text-sm font-black text-slate-900 uppercase tracking-widest">Products & Services</h4>
                                    <button onclick="ui.quotation_v2.addItem()" class="text-xs font-bold text-accent flex items-center gap-2">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                        Add Item
                                    </button>
                                </div>
                            </div>

                            <!-- Products Table -->
                            <div class="border border-slate-200 rounded-xl overflow-hidden min-h-[300px] flex flex-col">
                                <table class="builder-table">
                                    <thead>
                                        <tr>
                                            <th class="text-left">Product Name</th>
                                            <th class="text-left w-24">HSN/SAC</th>
                                            <th class="text-center w-28">Quantity</th>
                                            <th class="text-left w-32">Unit Price</th>
                                            <th class="text-center w-24">Disc %</th>
                                            <th class="text-left w-32">Price with Tax</th>
                                            <th class="text-right w-40">Amount</th>
                                            <th class="w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody id="qtn-line-items" class="bg-white">
                                        <!-- Items injected here -->
                                    </tbody>
                                </table>
                                
                                <!-- Empty State -->
                                <div id="qtn-empty-state" class="flex-1 flex flex-col items-center justify-center py-20 bg-slate-50/30">
                                    <div class="bg-white p-6 rounded-full shadow-sm mb-4">
                                        <svg class="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                                    </div>
                                    <p class="text-sm font-bold text-slate-400">Search products to add to this quotation 🚀</p>
                                    <button onclick="ui.quotation_v2.addItem()" class="mt-6 bg-accent text-white px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20">+ Add Item</button>
                                </div>
                            </div>
                        </div>

                        <!-- Section 4: Notes, Terms & Bank -->
                        <div class="grid grid-cols-12 gap-0 border-t border-slate-200">
                            <div class="col-span-12 lg:col-span-6 border-r border-slate-200 p-8 space-y-10">
                                <div>
                                    <div class="space-y-4">
                                        <div class="border border-slate-200 rounded-xl overflow-hidden bg-white">
                                            <div class="flex items-center justify-between bg-slate-50 px-4 py-2 border-b border-slate-200">
                                                <span class="text-xs font-black text-slate-900 border-b-2 border-accent pb-1">Terms & Conditions</span>
                                                <button onclick="ui.quotation_v2.loadDefaultTerms()" class="text-[9px] font-bold text-slate-500 uppercase underline">Load Default</button>
                                            </div>
                                            <div class="p-4">
                                                <textarea id="qtn-terms" class="w-full min-h-[120px] border-none focus:ring-0 text-sm p-0" placeholder="Enter terms & conditions..."></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Select Bank Account</label>
                                    <select id="qtn-bank" class="form-input text-sm font-bold bg-white border-slate-200 rounded-xl w-full">
                                        <option value="inr">${(state.settings && state.settings.bank_inr_name) || 'Domestic (INR)'} - ${(state.settings && state.settings.bank_inr_acc_no) || ''}</option>
                                        <option value="usd">${(state.settings && state.settings.bank_usd_name) || 'International (USD)'} - ${(state.settings && state.settings.bank_usd_acc_no) || ''}</option>
                                    </select>
                                </div>
                            </div>

                            <div class="col-span-12 lg:col-span-6 bg-slate-50/30 p-8">
                                <div class="flex flex-col h-full space-y-8">
                                    <div class="grid grid-cols-2 gap-8 mb-auto">
                                        <div class="col-start-2 space-y-4">
                                            <div class="flex justify-between items-center text-xs font-bold">
                                                <span class="text-slate-400">Taxable Amount</span>
                                                <span id="qtn-sum-taxable" class="text-slate-900">₹0.00</span>
                                            </div>
                                            <div id="qtn-tax-rows" class="space-y-4">
                                                <!-- Dynamic tax rows -->
                                            </div>
                                            <div class="flex justify-between items-center text-xs font-bold pt-2">
                                                <div class="flex items-center gap-2">
                                                    <span class="text-slate-400">Round Off</span>
                                                    <input type="checkbox" id="qtn-round-off" class="w-4 h-4 rounded-full border-slate-300 text-accent" onchange="ui.quotation_v2.updateCalculations()" checked>
                                                </div>
                                                <span id="qtn-sum-roundoff" class="text-slate-900">₹0.00</span>
                                            </div>
                                            <div id="qtn-bank-charges-container" class="flex justify-between items-center text-xs font-bold pt-2 border-t border-slate-100 hidden">
                                                <span class="text-slate-400">Bank Charges</span>
                                                <input type="number" id="qtn-bank-charges" step="0.01" value="0.00" class="text-right text-slate-900 bg-transparent border-none p-0 focus:ring-0 w-24 font-bold" oninput="ui.quotation_v2.updateCalculations()">
                                            </div>
                                            <div class="flex justify-between items-center pt-4 border-t border-slate-200">
                                                <span class="text-lg font-black text-slate-900">Total Value</span>
                                                <span id="qtn-sum-total" class="text-2xl font-black text-accent tabular-nums">₹0.00</span>
                                            </div>
                                            <div id="qtn-sum-discount" class="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right mt-1">Total Discount: ₹0.00</div>
                                        </div>
                                    </div>

                                    <div class="space-y-6">
                                        <div>
                                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Signature Toggle</label>
                                            <div onclick="ui.quotation_v2.toggleSignature()" id="qtn-sig-toggle" class="border border-[#fbcfe8] bg-[#fdf2f8] p-3 rounded-lg text-xs font-bold text-[#ec4899] border-dashed text-center cursor-pointer hover:bg-[#fce7f3] transition-all flex items-center justify-center gap-2">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                <span id="qtn-sig-label">Show Signature on Document</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Builder Sticky Footer -->
                    <div class="modal-footer-sticky bg-white border-t border-slate-200 py-3 px-6 shadow-2xl flex justify-between items-center shrink-0">
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Value:</span>
                            <span id="qtn-footer-total" class="text-sm font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">₹0.00</span>
                        </div>
                        <div class="flex gap-3">
                            <button onclick="ui.quotation_v2.save(true)" class="px-6 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-slate-100 transition-all">Save as Draft</button>
                            <button onclick="ui.quotation_v2.save(false, true)" class="px-6 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-slate-100 transition-all">Save and Print</button>
                            <button onclick="ui.quotation_v2.save(false)" class="px-8 py-2 bg-blue-600 text-white rounded-lg text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2">
                                Save Quotation <span class="bg-blue-500 px-2 py-0.5 rounded text-[10px]">Ctrl + S</span>
                            </button>
                        </div>
                    </div>
                </div>
                `;
                    ui.quotation_v2.updateDocNo();
                    ui.quotation_v2.addItem();
                    ui.quotation_v2.loadDefaultTerms();

                } else if (type === 'proforma-new') {
                    const today = new Date().toISOString().split('T')[0];
                    const validityDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

                    root.innerHTML = `
                <div class="modal-content p-0 w-full max-w-[98vw] h-[98vh] overflow-hidden flex flex-col bg-slate-50 border-none rounded-none">
                    <!-- Builder Top Bar -->
                    <div class="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shrink-0">
                        <div class="flex items-center gap-3">
                            <span class="text-xs font-bold text-slate-800 uppercase tracking-widest">Create Proforma Invoice</span>
                        </div>
                        <div class="flex items-center gap-4">
                            <button onclick="ui.modal.close()" class="p-1.5 text-slate-400 hover:text-slate-900 transition-colors">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                    </div>

                    <!-- Builder Body -->
                    <div class="flex-1 overflow-y-auto builder-container">
                        <!-- Section 1: Customer & Header Meta -->
                        <div class="builder-section grid grid-cols-12 gap-0 border-b-2">
                            <div class="col-span-12 lg:col-span-3 pr-8">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Select Customer</label>
                                <div class="customer-search-container">
                                    <input type="text" id="pfi-customer-search" 
                                           class="w-full text-lg font-black bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-300" 
                                           placeholder="Type customer name..."
                                           oninput="ui.proforma_v2.filterCustomers(this.value)"
                                           autocomplete="off">
                                    <input type="hidden" id="pfi-customer">
                                    <div id="pfi-customer-results" class="customer-results-list hidden"></div>
                                </div>
                                <div class="mt-4 flex gap-4">
                                    <button onclick="ui.modal.open('customer')" class="text-xs font-bold text-accent">+ Create Customer</button>
                                </div>
                            </div>
                            
                            <div class="col-span-12 lg:col-span-9 flex border-l border-slate-100 pl-8 gap-8">
                                <div class="builder-header-field flex-1">
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">PFI Invoice #</label>
                                    <div class="flex items-center gap-2">
                                        <input type="text" id="pfi-no" class="text-sm font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0 w-52" readonly>
                                        <input type="date" id="pfi-date" value="${today}" class="text-sm font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:ring-0" onchange="ui.proforma_v2.updateDocNo()">
                                    </div>
                                </div>
                                <div class="builder-header-field flex-1">
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Transaction Type</label>
                                    <select id="pfi-type" class="text-sm font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0 w-full" onchange="ui.proforma_v2.toggleExportFields(); ui.proforma_v2.updateCalculations();">
                                        <option value="Regular">Regular (GST)</option>
                                        <option value="Without GST">Without GST</option>
                                        <option value="LUT / Export">LUT / Export</option>
                                    </select>
                                </div>
                                <div class="builder-header-field flex-1">
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Due Date</label>
                                    <input type="date" id="pfi-validity" value="${validityDate}" class="text-sm font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0">
                                </div>
                            </div>
                        </div>

                        <!-- Section 2: Purchase Details & Custom Fields -->
                        <div class="builder-section bg-slate-50/50 py-6 border-b-2">
                            <div class="grid grid-cols-12 gap-8">
                                <div class="col-span-12 lg:col-span-4 border-r border-slate-200 pr-8">
                                    <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Purchase / Contract Details</h4>
                                    <div class="grid grid-cols-2 gap-4">
                                        <div>
                                            <label class="text-[10px] font-bold text-slate-400 block mb-1">Order/Contract No.</label>
                                            <input type="text" id="pfi-purchase-no" class="form-input text-sm font-bold bg-white border-slate-200 rounded-lg w-full" placeholder="PO/2024/001">
                                        </div>
                                        <div>
                                            <label class="text-[10px] font-bold text-slate-400 block mb-1">Order Date</label>
                                            <input type="date" id="pfi-purchase-date" value="${today}" class="form-input text-sm font-bold bg-white border-slate-200 rounded-lg w-full">
                                        </div>
                                    </div>
                                </div>
                                <div class="col-span-12 lg:col-span-8">
                                    <div class="flex items-center justify-between mb-4">
                                        <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Additional Metadata (Custom Fields)</h4>
                                        <button onclick="ui.proforma_v2.addCustomField()" class="text-[10px] font-black text-accent uppercase tracking-widest hover:text-blue-700 transition-colors flex items-center gap-1">
                                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                                            Add Custom Field
                                        </button>
                                    </div>
                                    <div id="pfi-custom-fields" class="grid grid-cols-2 gap-x-8 gap-y-4">
                                        <!-- Custom fields will be injected here -->
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Section 2.5: Delivery & Payment Terms (Single Row) -->
                        <div class="builder-section bg-white py-4 border-b-2">
                            <div class="grid grid-cols-3 gap-6">
                                <div>
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Payment Terms</label>
                                    <input type="text" id="pfi-payment-terms" class="form-input text-sm font-bold bg-slate-50 border-slate-200 rounded-lg w-full" placeholder="e.g., 100% Advance">
                                </div>
                                <div>
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Delivery Time</label>
                                    <input type="text" id="pfi-delivery-time" class="form-input text-sm font-bold bg-slate-50 border-slate-200 rounded-lg w-full" placeholder="e.g., 2-3 weeks">
                                </div>
                                <div>
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Delivery Mode</label>
                                    <input type="text" id="pfi-delivery-mode" class="form-input text-sm font-bold bg-slate-50 border-slate-200 rounded-lg w-full" placeholder="e.g., By Road">
                                </div>
                            </div>
                        </div>

                        <!-- Section 2.7: Export & Currency Details (Conditional) -->
                        <div id="pfi-export-fields" class="hidden builder-section bg-orange-50/20 py-4 border-b-2 border-orange-100">
                             <div class="grid grid-cols-2 gap-6">
                                <div>
                                    <label class="text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-2">Supply Country</label>
                                    <select id="pfi-country" class="form-input text-sm font-bold bg-white border-orange-100 rounded-lg w-full">
                                        ${Constants.Countries.map(c => `<option value="${c}" ${c === 'India' ? 'selected' : ''}>${c}</option>`).join('')}
                                    </select>
                                </div>
                                <div>
                                    <label class="text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-2">Currency</label>
                                    <select id="pfi-currency" class="form-input text-sm font-bold bg-white border-orange-100 rounded-lg w-full" onchange="ui.proforma_v2.updateCalculations()">
                                        <option value="INR" selected>INR (₹)</option>
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Section 3: Products & Services -->
                        <div class="builder-section">
                            <div class="flex items-center justify-between mb-8">
                                <div class="flex items-center gap-6">
                                    <h4 class="text-sm font-black text-slate-900 uppercase tracking-widest">Products & Services</h4>
                                    <button onclick="ui.proforma_v2.addItem()" class="text-xs font-bold text-accent flex items-center gap-2">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                        Add New Product?
                                    </button>
                                </div>
                            </div>


                            <!-- Products Table -->
                            <div class="border border-slate-200 rounded-xl overflow-hidden min-h-[300px] flex flex-col">
                                <table class="builder-table">
                                    <thead>
                                        <tr>
                                            <th class="text-left">Product Name</th>
                                            <th class="text-left w-24">HSN/SAC</th>
                                            <th class="text-center w-28">Quantity</th>
                                            <th class="text-left w-32">Unit Price</th>
                                            <th class="text-center w-24">Disc %</th>
                                            <th class="text-left w-32">Price with Tax</th>
                                            <th class="text-right w-40">Amount</th>
                                            <th class="w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody id="pfi-line-items" class="bg-white">
                                        <!-- Items will be injected here -->
                                    </tbody>
                                </table>
                                
                                <!-- Empty State -->
                                <div id="pfi-empty-state" class="flex-1 flex flex-col items-center justify-center py-20 bg-slate-50/30">
                                    <div class="bg-white p-6 rounded-full shadow-sm mb-4">
                                        <svg class="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                                    </div>
                                    <p class="text-sm font-bold text-slate-400">Search existing products to add to this list or add new product to get started! 🚀</p>
                                    <button onclick="ui.proforma_v2.addItem()" class="mt-6 bg-accent text-white px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20">+ Add New Product</button>
                                </div>
                            </div>
                            
                        </div>

                        <!-- Section 4: Notes, Terms & Bank -->
                        <div class="grid grid-cols-12 gap-0 border-t border-slate-200">
                            <div class="col-span-12 lg:col-span-6 border-r border-slate-200 p-8 space-y-10">
                                <div>
                                    <div class="space-y-4">
                                        <div class="border border-slate-200 rounded-xl overflow-hidden bg-white">
                                            <div class="flex items-center justify-between bg-slate-50 px-4 py-2 border-b border-slate-200">
                                                <span class="text-xs font-black text-slate-900 border-b-2 border-accent pb-1">Terms & Conditions</span>
                                                <button onclick="ui.proforma_v2.loadDefaultTerms()" class="text-[9px] font-bold text-slate-500 uppercase underline">Load Default</button>
                                            </div>
                                            <div class="p-4">
                                                <textarea id="pfi-terms" class="w-full min-h-[120px] border-none focus:ring-0 text-sm p-0" placeholder="Enter terms & conditions..."></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Select Bank Account</label>
                                    <select id="pfi-bank" class="form-input text-sm font-bold bg-white border-slate-200 rounded-xl w-full">
                                        <option value="inr">${(state.settings && state.settings.bank_inr_name) || 'Domestic (INR)'} - ${(state.settings && state.settings.bank_inr_acc_no) || ''}</option>
                                        <option value="usd">${(state.settings && state.settings.bank_usd_name) || 'International (USD)'} - ${(state.settings && state.settings.bank_usd_acc_no) || ''}</option>
                                    </select>
                                </div>


                            </div>

                            <div class="col-span-12 lg:col-span-6 bg-slate-50/30 p-8">
                                <div class="flex flex-col h-full space-y-8">
                                    <div class="grid grid-cols-2 gap-8 mb-auto">
                                        <div class="col-start-2 space-y-4">
                                            <div class="flex justify-between items-center text-xs font-bold">
                                                <span class="text-slate-400">Taxable Amount</span>
                                                <span id="pfi-sum-taxable" class="text-slate-900">₹0.00</span>
                                            </div>
                                            <div id="pfi-tax-rows" class="space-y-4">
                                                <!-- Dynamic tax rows -->
                                            </div>
                                            <div class="flex justify-between items-center text-xs font-bold pt-2">
                                                <div class="flex items-center gap-2">
                                                    <span class="text-slate-400">Round Off</span>
                                                    <input type="checkbox" class="w-4 h-4 rounded-full border-slate-300 text-accent" checked>
                                                </div>
                                                <span class="text-slate-900">₹0.00</span>
                                            </div>
                                            <div id="pfi-bank-charges-container" class="flex justify-between items-center text-xs font-bold pt-2 border-t border-slate-100 hidden">
                                                <span class="text-slate-400">Bank Charges</span>
                                                <input type="number" id="pfi-bank-charges" step="0.01" value="0.00" class="text-right text-slate-900 bg-transparent border-none p-0 focus:ring-0 w-24 font-bold" oninput="ui.proforma_v2.updateCalculations()">
                                            </div>
                                            <div class="flex justify-between items-center pt-4 border-t border-slate-200">
                                                <span class="text-lg font-black text-slate-900">Total Amount</span>
                                                <span id="pfi-sum-total" class="text-2xl font-black text-accent tabular-nums">₹0.00</span>
                                            </div>
                                            <div id="pfi-sum-discount" class="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right mt-1">Total Discount: ₹0.00</div>
                                        </div>
                                    </div>

                                    <div class="space-y-6">

                                        <div>
                                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Select Signature <svg class="w-3 h-3 inline text-slate-300" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg></label>
                                            <div class="border border-[#fbcfe8] bg-[#fdf2f8] p-3 rounded-lg text-xs font-bold text-[#ec4899] border-dashed text-center cursor-pointer hover:bg-[#fce7f3] transition-all flex items-center justify-center gap-2">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                Add Signature to Invoice (Optional)
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Builder Sticky Footer -->
                    <div class="modal-footer-sticky bg-white border-t border-slate-200 py-3 px-6 shadow-2xl flex justify-between items-center shrink-0">
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Amount:</span>
                            <span id="pfi-footer-total" class="text-sm font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">₹0.00</span>
                        </div>
                        <div class="flex gap-3">
                            <button onclick="ui.proforma_v2.save(true)" class="px-6 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-slate-100 transition-all">Save as Draft</button>
                            <button onclick="ui.proforma_v2.save(false, true)" class="px-6 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-slate-100 transition-all">Save and Print</button>
                            <button onclick="ui.proforma_v2.save(false)" class="px-8 py-2 bg-blue-600 text-white rounded-lg text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2">
                                Save <span class="bg-blue-500 px-2 py-0.5 rounded text-[10px]">Ctrl + S</span>
                            </button>
                        </div>
                    </div>
                </div>
                `;
                    if (!ui.proforma_v2.activeId) {
                        ui.proforma_v2.updateDocNo();
                        ui.proforma_v2.addItem();
                        ui.proforma_v2.loadDefaultTerms();
                    }
                } else if (['quotations', 'proforma', 'challans', 'credit_notes', 'debit_notes', 'purchase_orders'].includes(type)) {
                    const config = {
                        quotations: { title: 'New Quotation', label: 'Quotation #', prefix: 'QTN', color: 'teal' },
                        proforma: { title: 'New Pro Forma Invoice', label: 'Pro Forma #', prefix: 'PFI', color: 'sky' },
                        challans: { title: 'New Delivery Challan', label: 'Challan #', prefix: 'CHL', color: 'emerald' },
                        credit_notes: { title: 'New Credit Note', label: 'Credit Note #', prefix: 'CN', color: 'rose' },
                        debit_notes: { title: 'New Debit Note', label: 'Debit Note #', prefix: 'DN', color: 'amber' },
                        purchase_orders: { title: 'New Purchase Order', label: 'PO #', prefix: 'PO', color: 'violet' }
                    }[type];

                    root.innerHTML = `
                        <div class="modal-content p-8 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slide-up bg-white">
                            <div class="flex justify-between items-center mb-8">
                                <h3 class="text-2xl font-bold text-slate-900 font-display">${config.title}</h3>
                                <div class="text-right">
                                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document Date</p>
                                    <input type="date" id="doc-date" class="border-0 font-bold text-slate-900 outline-none" value="${new Date().toISOString().split('T')[0]}">
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-8 mb-8">
                                <div class="glass p-6 rounded-2xl bg-slate-50/50">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Select Customer</label>
                                    <select id="doc-customer" class="form-input" onchange="ui.doc.updateCalculations()">
                                        <option value="">Select Customer...</option>
                                        ${state.customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="glass p-6 rounded-2xl bg-slate-50/50">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">${config.label}</label>
                                    <input type="text" id="doc-no" class="form-input font-mono font-bold" value="${config.prefix}-${Date.now().toString().slice(-6)}">
                                </div>
                            </div>

                            <div class="mb-4">
                                <div class="line-item-row bg-slate-50 text-[10px] uppercase font-bold text-slate-400 px-4 rounded-t-xl border-b-0">
                                    <span>Product / Service</span>
                                    <span>Qty</span>
                                    <span>Rate</span>
                                    <span class="text-right">Amount</span>
                                    <span></span>
                                </div>
                                <div id="doc-line-items" class="divide-y divide-slate-100 border-x border-b border-slate-100 rounded-b-xl px-4">
                                    <!-- Items injected here -->
                                </div>
                                <button onclick="ui.doc.addItem()" class="mt-4 text-${config.color}-600 font-bold text-xs uppercase tracking-widest hover:text-${config.color}-700 transition-colors">+ Add Line Item</button>
                            </div>

                            <div class="invoice-summary border-${config.color}-100 bg-${config.color}-50/10">
                                <div class="grid grid-cols-2 gap-12">
                                    <div>
                                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Notes / Terms</label>
                                        <textarea id="doc-notes" class="form-input h-24 text-xs" placeholder="Valid for 15 days..."></textarea>
                                    </div>
                                    <div class="space-y-2">
                                        <div class="summary-row"><span>Subtotal</span><span id="doc-subtotal">₹0.00</span></div>
                                        <div id="doc-tax-breakdown" class="space-y-1"></div>
                                        <div class="summary-row total"><span>Total Amount</span><span id="doc-total">₹0.00</span></div>
                                    </div>
                                </div>
                            </div>

                            <div class="flex justify-end gap-3 pt-10">
                                <button type="button" onclick="ui.modal.close()" class="px-8 py-3 text-slate-500 font-medium hover:text-slate-700 transition-colors">Discard</button>
                                <button onclick="api.docs.save('${type}')" class="bg-${config.color}-600 text-white px-10 py-3 rounded-xl font-bold hover:bg-${config.color}-700 transition-all shadow-xl shadow-${config.color}-500/20">Generate & Save ${type.charAt(0).toUpperCase() + type.slice(1, -1)}</button>
                            </div>
                        </div>
                    `;
                    ui.doc.addItem();
                } else if (type === 'gst-report-detail') {
                    const reportType = data; // 'b2b', 'b2c', 'b2cl', 'b2cs', 'exp', '3b'
                    let title = '';
                    let items = [];

                    const myState = state.settings?.state;

                    if (reportType === 'b2b') {
                        title = 'GSTR-1: B2B Transactions (Registered)';
                        items = state.invoices.filter(inv => inv.type === 'Regular');
                    } else if (reportType === 'b2cl') {
                        title = 'GSTR-1: B2C Large (>2.5L Interstate)';
                        items = state.invoices.filter(inv => {
                            if (inv.type !== 'Without GST') return false;
                            const totalINR = inv.total_amount * (inv.exchange_rate || 1.0);
                            const custState = inv.customers?.state || '';
                            const isInterstate = myState && custState && myState !== custState;
                            return isInterstate && totalINR > 250000;
                        });
                    } else if (reportType === 'b2cs') {
                        title = 'GSTR-1: B2C Small Transactions';
                        items = state.invoices.filter(inv => {
                            if (inv.type !== 'Without GST') return false;
                            const totalINR = inv.total_amount * (inv.exchange_rate || 1.0);
                            const custState = inv.customers?.state || '';
                            const isInterstate = myState && custState && myState !== custState;
                            return !(isInterstate && totalINR > 250000);
                        });
                    } else if (reportType === 'exp') {
                        title = 'GSTR-1: Export Transactions (EXP)';
                        items = state.invoices.filter(inv => inv.type === 'LUT / Export');
                    } else if (reportType === '3b') {
                        title = 'GSTR-3B: Detailed Tax Breakup';
                    }

                    const renderRows = () => {
                        if (reportType === '3b') {
                            return `
                                <tr class="bg-blue-50/30 font-black">
                                    <td class="p-4 rounded-l-2xl">1. Outward Taxable Supplies</td>
                                    <td class="p-4 text-right">₹${state.reports.sales.taxable.toLocaleString()}</td>
                                    <td class="p-4 text-right rounded-r-2xl">₹${state.reports.sales.tax.toLocaleString()}</td>
                                </tr>
                                <tr class="bg-orange-50/30 font-black">
                                    <td class="p-4 rounded-l-2xl">2. Eligible ITC (Purchases)</td>
                                    <td class="p-4 text-right">₹${state.reports.purchases.taxable.toLocaleString()}</td>
                                    <td class="p-4 text-right rounded-r-2xl">₹${state.reports.purchases.tax.toLocaleString()}</td>
                                </tr>
                                <tr class="bg-slate-900 text-white font-black">
                                    <td class="p-4 rounded-l-2xl">Net GST Payable (1 - 2)</td>
                                    <td class="p-4 text-right">-</td>
                                    <td class="p-4 text-right rounded-r-2xl">₹${Math.max(0, state.reports.sales.tax - state.reports.purchases.tax).toLocaleString()}</td>
                                </tr>
                            `;
                        }

                        return items.map(inv => {
                            const exRate = inv.exchange_rate || 1.0;
                            return `
                            <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                <td class="py-4 font-mono font-bold text-xs">${inv.invoice_no}</td>
                                <td class="py-4 text-sm font-bold text-slate-900">${inv.customers?.name || 'Cash Sale'}</td>
                                <td class="py-4 text-[10px] font-mono text-slate-400">${inv.customers?.gstin || '-'}</td>
                                <td class="py-4 text-right font-bold text-slate-900">₹${(inv.subtotal * exRate).toLocaleString()}</td>
                                <td class="py-4 text-right font-black text-blue-600">₹${((inv.total_amount - inv.subtotal) * exRate).toLocaleString()}</td>
                            </tr>
                            `;
                        }).join('') || '<tr><td colspan="5" class="py-20 text-center font-bold text-slate-400">No transactions found for this category.</td></tr>';
                    };

                    root.innerHTML = `
                        <div class="modal-content p-0 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up bg-white">
                            <div class="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h3 class="text-2xl font-black text-slate-900 font-display">${title}</h3>
                                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">FY ${state.fy} • Reporting Period Audit</p>
                                </div>
                                <button onclick="ui.modal.close()" class="p-2 hover:bg-white rounded-xl shadow-sm border border-slate-200 transition-all">
                                    <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                            
                            <div class="flex-1 overflow-y-auto p-8">
                                <table class="w-full">
                                    <thead>
                                        <tr class="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100">
                                            <th class="pb-4">${reportType === '3b' ? 'Description' : 'Invoice #'}</th>
                                            <th class="pb-4">${reportType === '3b' ? 'Total Taxable' : 'Customer'}</th>
                                            ${reportType === '3b' ? '' : '<th class="pb-4">GSTIN</th>'}
                                            ${reportType === '3b' ? '<th class="pb-4 text-right">Tax Amount</th>' : '<th class="pb-4 text-right">Taxable Value</th><th class="pb-4 text-right">GST Amount</th>'}
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-slate-50">
                                        ${renderRows()}
                                    </tbody>
                                </table>
                            </div>

                            <div class="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 items-center">
                                <p class="text-[10px] text-slate-500 font-medium italic mr-auto">Amounts in INR via transaction rates.</p>
                                <button class="bg-white text-slate-900 border border-slate-200 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all" onclick="ui.reports.exportTableJSON('${reportType}')">JSON</button>
                                <button class="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200 hover:scale-105 transition-all" onclick="ui.reports.exportTableExcel('${reportType}')">Export to Excel</button>
                            </div>
                        </div>
                    `;
                } else if (type === 'gstr1-preview') {
                    const gstr1 = data;
                    const totalTaxable =
                        gstr1.b2b.reduce((sum, inv) => sum + (inv.subtotal * (inv.exchange_rate || 1)), 0) +
                        gstr1.b2cl.reduce((sum, inv) => sum + (inv.subtotal * (inv.exchange_rate || 1)), 0) +
                        gstr1.b2cs.reduce((sum, entry) => sum + entry.taxable, 0) +
                        gstr1.exp.reduce((sum, inv) => sum + (inv.subtotal * (inv.exchange_rate || 1)), 0);

                    const totalTax =
                        gstr1.b2b.reduce((sum, inv) => sum + ((inv.total_amount - inv.subtotal) * (inv.exchange_rate || 1)), 0) +
                        gstr1.b2cl.reduce((sum, inv) => sum + ((inv.total_amount - inv.subtotal) * (inv.exchange_rate || 1)), 0) +
                        gstr1.b2cs.reduce((sum, entry) => sum + entry.igst + entry.cgst + entry.sgst, 0);

                    root.innerHTML = `
                        <div class="modal-content p-0 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up bg-white">
                            <div class="p-8 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                                <div class="flex justify-between items-center">
                                    <div>
                                        <h3 class="text-3xl font-black text-slate-900 font-display">GSTR-1 Return Preview</h3>
                                        <p class="text-sm font-bold text-blue-600 mt-1">${gstr1.period}</p>
                                    </div>
                                    <button onclick="ui.modal.close()" class="p-2 hover:bg-white rounded-xl shadow-sm border border-slate-200 transition-all">
                                        <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="flex-1 overflow-y-auto p-8">
                                <div class="grid grid-cols-2 gap-6 mb-8">
                                    <div class="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Taxable Value</p>
                                        <p class="text-3xl font-black text-slate-900">₹${totalTaxable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    </div>
                                    <div class="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total GST Amount</p>
                                        <p class="text-3xl font-black text-blue-600">₹${totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    </div>
                                </div>
                                
                                <div class="space-y-4">
                                    <h4 class="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Return Breakdown</h4>
                                    
                                    <div class="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                        <div class="flex items-center gap-4">
                                            <div class="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-black">B2B</div>
                                            <div>
                                                <p class="text-sm font-black text-slate-900">Registered Business</p>
                                                <p class="text-[10px] text-slate-500 font-bold">Invoice-level details</p>
                                            </div>
                                        </div>
                                        <div class="text-right">
                                            <p class="text-lg font-black text-slate-900">${gstr1.b2b.length} invoices</p>
                                            <p class="text-[10px] text-emerald-600 font-bold">Table 4A, 4B</p>
                                        </div>
                                    </div>
                                    
                                    <div class="flex items-center justify-between p-4 bg-pink-50 border border-pink-100 rounded-2xl">
                                        <div class="flex items-center gap-4">
                                            <div class="w-12 h-12 bg-pink-600 text-white rounded-xl flex items-center justify-center font-black text-xs">B2CL</div>
                                            <div>
                                                <p class="text-sm font-black text-slate-900">B2C Large (>2.5L Interstate)</p>
                                                <p class="text-[10px] text-slate-500 font-bold">Invoice-level details</p>
                                            </div>
                                        </div>
                                        <div class="text-right">
                                            <p class="text-lg font-black text-slate-900">${gstr1.b2cl.length} invoices</p>
                                            <p class="text-[10px] text-pink-600 font-bold">Table 5A, 5B</p>
                                        </div>
                                    </div>
                                    
                                    <div class="flex items-center justify-between p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                                        <div class="flex items-center gap-4">
                                            <div class="w-12 h-12 bg-orange-600 text-white rounded-xl flex items-center justify-center font-black text-xs">B2CS</div>
                                            <div>
                                                <p class="text-sm font-black text-slate-900">B2C Small</p>
                                                <p class="text-[10px] text-slate-500 font-bold">State & rate-wise aggregated</p>
                                            </div>
                                        </div>
                                        <div class="text-right">
                                            <p class="text-lg font-black text-slate-900">${gstr1.b2cs.length} entries</p>
                                            <p class="text-[10px] text-orange-600 font-bold">Table 7</p>
                                        </div>
                                    </div>
                                    
                                    <div class="flex items-center justify-between p-4 bg-purple-50 border border-purple-100 rounded-2xl">
                                        <div class="flex items-center gap-4">
                                            <div class="w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center font-black text-xs">EXP</div>
                                            <div>
                                                <p class="text-sm font-black text-slate-900">Export Invoices</p>
                                                <p class="text-[10px] text-slate-500 font-bold">LUT / With payment of tax</p>
                                            </div>
                                        </div>
                                        <div class="text-right">
                                            <p class="text-lg font-black text-slate-900">${gstr1.exp.length} invoices</p>
                                            <p class="text-[10px] text-purple-600 font-bold">Table 6A</p>
                                        </div>
                                    </div>
                                    
                                    <div class="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                                        <div class="flex items-center gap-4">
                                            <div class="w-12 h-12 bg-slate-600 text-white rounded-xl flex items-center justify-center font-black text-[10px]">HSN-D</div>
                                            <div>
                                                <p class="text-sm font-black text-slate-900">HSN Summary (Domestic)</p>
                                                <p class="text-[10px] text-slate-500 font-bold">Aggregated by HSN/SAC code</p>
                                            </div>
                                        </div>
                                        <div class="text-right">
                                            <p class="text-lg font-black text-slate-900">${gstr1.hsnDomestic.length} codes</p>
                                            <p class="text-[10px] text-slate-600 font-bold">Table 12</p>
                                        </div>
                                    </div>

                                    <div class="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                                        <div class="flex items-center gap-4">
                                            <div class="w-12 h-12 bg-slate-700 text-white rounded-xl flex items-center justify-center font-black text-[10px]">HSN-E</div>
                                            <div>
                                                <p class="text-sm font-black text-slate-900">HSN Summary (Export)</p>
                                                <p class="text-[10px] text-slate-500 font-bold">Aggregated by HSN/SAC code</p>
                                            </div>
                                        </div>
                                        <div class="text-right">
                                            <p class="text-lg font-black text-slate-900">${gstr1.hsnExport.length} codes</p>
                                            <p class="text-[10px] text-slate-600 font-bold">Table 12</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                                <button onclick="ui.modal.close()" class="bg-white text-slate-900 border border-slate-200 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">Close</button>
                                <button onclick="ui.reports.downloadGSTR1Excel()" class="bg-blue-600 text-white px-10 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-all">Download Consolidated Excel</button>
                            </div>
                        </div>
                    `;
                } else if (type === 'license') {
                    const licenseData = data && data.id ? state.licenses.find(l => l.id === data.id) : (data || {});

                    // Prepare contacts HTML if customer is selected
                    let contacts_html = '<option value="">Select Contact...</option>';
                    if (licenseData.customer_id) {
                        const cust = state.customers.find(c => c.id === licenseData.customer_id);
                        if (cust && cust.contacts) {
                            contacts_html += cust.contacts.map(c =>
                                `<option value="${c.name}" ${licenseData.contact_person === c.name ? 'selected' : ''}>${c.name} (${c.role || 'No Role'})</option>`
                            ).join('');
                        }
                    }

                    root.innerHTML = Templates.LicenseForm({ ...licenseData, contacts_html });

                    // Trigger status preview if end date exists
                    if (licenseData.end_date) {
                        ui.licenses.updatePreviewStatus(licenseData.end_date);
                    }
                }
            },
            close: () => {
                ui.quotation_v2.activeId = null;
                ui.quotation_v2.activeStatus = null;
                document.getElementById('modal-overlay').classList.remove('active');
            },

            edit: (type, id) => {
                ui.modal.open(type);
                const table = type === 'product' ? 'products' : 'customers';
                const item = state[table].find(i => i.id === id);
                if (item) {
                    const form = document.getElementById(`${type} -form`);
                    if (!form) return;

                    Object.keys(item).forEach(key => {
                        // Special handling for Additional Contacts
                        if (key === 'contacts' && Array.isArray(item[key])) {
                            // Clear existing if any (fresh form so likely empty, but good practice)
                            const container = document.getElementById('additional-contacts-list');
                            if (container) container.innerHTML = '';

                            item[key].forEach(contact => {
                                const rowId = ui.customer.addContact();
                                if (form.elements[`extra_contact_name_${rowId} `]) form.elements[`extra_contact_name_${rowId} `].value = contact.name || '';
                                if (form.elements[`extra_contact_mobile_${rowId} `]) form.elements[`extra_contact_mobile_${rowId} `].value = contact.mobile || '';
                                if (form.elements[`extra_contact_email_${rowId} `]) form.elements[`extra_contact_email_${rowId} `].value = contact.email || '';
                                if (form.elements[`extra_contact_role_${rowId} `]) form.elements[`extra_contact_role_${rowId} `].value = contact.role || '';
                            });
                        } else {
                            const field = form.elements[key];
                            if (field) {
                                if (field.type === 'checkbox') {
                                    field.checked = !!item[key];
                                } else {
                                    field.value = item[key] || '';
                                }
                            }
                        }
                    });
                }
            }
        },
        licenses: {
            filters: { category: '', type: '' },
            searchQuery: '',

            search: (val) => {
                ui.licenses.searchQuery = val;
                render();
                // Restore focus after render
                const input = document.getElementById('lic-search-input');
                if (input) {
                    input.focus();
                    input.setSelectionRange(val.length, val.length);
                }
            },

            filter: (key, val) => {
                ui.licenses.filters[key] = val;
                render();
            },

            onCustomerChange: (customerId) => {
                const customer = state.customers.find(c => c.id === customerId);
                const locationInput = document.getElementById('lic-location');
                const contactSelect = document.getElementById('lic-contact-person');

                if (customer) {
                    locationInput.value = customer.billing_city || '';
                    let html = '<option value="">Select Contact...</option>';
                    if (customer.contacts && Array.isArray(customer.contacts)) {
                        html += customer.contacts.map(c => `<option value="${c.name}">${c.name} (${c.role || 'No Role'})</option>`).join('');
                    }
                    contactSelect.innerHTML = html;
                }
            },

            onTypeChange: (val) => {
                const container = document.getElementById('renewal-link-container');
                if (val === 'Renewal') {
                    container.classList.remove('hidden');
                } else {
                    container.classList.add('hidden');
                }
            },

            updatePreviewStatus: (endDate) => {
                const badge = document.getElementById('lic-status-badge');
                if (!badge) return;

                if (!endDate) {
                    badge.textContent = 'Awaiting Date';
                    badge.className = 'bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest';
                    return;
                }

                const ed = new Date(endDate);
                const now = new Date();
                const diffDays = Math.ceil((ed - now) / (1000 * 60 * 60 * 24));

                if (diffDays < 0) {
                    badge.textContent = 'Expired';
                    badge.className = 'bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest';
                } else if (diffDays <= 30) {
                    badge.textContent = 'Expiring Soon';
                    badge.className = 'bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest';
                } else {
                    badge.textContent = 'In Warranty';
                    badge.className = 'bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest';
                }
            },

            export: () => {
                if (typeof XLSX === 'undefined') {
                    api.notifications.show('Excel library not loaded', 'error');
                    return;
                }
                const wb = XLSX.utils.book_new();
                const data = state.licenses.map(lic => ({
                    'Customer': lic.customers?.name || 'N/A',
                    'Location': lic.location || 'N/A',
                    'Software': lic.software_name || 'N/A',
                    'Category': lic.category || 'N/A',
                    'Type': lic.type || 'N/A',
                    'Serial Number': lic.serial_number || 'N/A',
                    'Activation Key': lic.activation_key || 'N/A',
                    'Start Date': lic.start_date || 'N/A',
                    'End Date': lic.end_date || 'N/A',
                    'Status': lic.status || 'N/A',
                    'Notes': lic.notes || ''
                }));
                const ws = XLSX.utils.json_to_sheet(data);
                XLSX.utils.book_append_sheet(wb, ws, "Licenses");
                XLSX.writeFile(wb, `License_Registry_${new Date().toISOString().slice(0, 10)}.xlsx`);
                api.notifications.show('Registry Exported');
            }
        },
        sidebar: {
            toggle: (id) => {
                const content = document.getElementById(`dropdown - ${id} `);
                const trigger = content.previousElementSibling;
                content.classList.toggle('active');
                trigger.classList.toggle('active');
            }
        },
        reports: {
            openModal: (type) => ui.modal.open('gst-report-detail', type),
            exportJSON: () => {
                const data = {
                    fy: state.fy,
                    generated_at: new Date().toISOString(),
                    sales_summary: state.reports.sales,
                    purchase_summary: state.reports.purchases,
                    hsn_summary: state.reports.hsn,
                    invoices: state.invoices,
                    purchases: state.purchases
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `GST_Report_Full_${state.fy}_${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
                api.notifications.show('Full Report Exported (JSON)');
            },
            exportExcel: () => {
                const wb = XLSX.utils.book_new();

                // 1. Sales Summary
                const salesSummary = [
                    { Category: 'Total Taxable (INR)', Amount: state.reports.sales.taxable },
                    { Category: 'Total GST (INR)', Amount: state.reports.sales.tax },
                    { Category: 'B2B (Registered)', Amount: state.reports.sales.b2b },
                    { Category: 'B2C Small', Amount: state.reports.sales.b2cs },
                    { Category: 'B2C Large (>2.5L Interstate)', Amount: state.reports.sales.b2cl },
                    { Category: 'EXP (Export)', Amount: state.reports.sales.exp }
                ];
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(salesSummary), "Sales Summary");

                // 2. Purchase Summary
                const purSummary = [
                    { Category: 'Total Taxable', Amount: state.reports.purchases.taxable },
                    { Category: 'Total ITC', Amount: state.reports.purchases.tax }
                ];
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(purSummary), "Purchase Summary");

                // 3. HSN Summary (Table 12)
                const hsnData = Object.values(state.reports.hsn).map(h => ({
                    'HSN/SAC': h.code,
                    'Description': h.desc,
                    'Taxable Value': h.taxable,
                    'Total Tax': h.tax,
                    'Total Value': h.taxable + h.tax
                }));
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hsnData), "HSN Summary");

                // 4. Detailed Invoices
                const invData = state.invoices.map(inv => ({
                    'Date': inv.date,
                    'Invoice No': inv.invoice_no,
                    'Customer': inv.customers?.name || 'Cash Sale',
                    'GSTIN': inv.customers?.gstin || '-',
                    'Type': inv.type,
                    'Taxable (INR)': inv.subtotal * (inv.exchange_rate || 1.0),
                    'Tax (INR)': (inv.total_amount - inv.subtotal) * (inv.exchange_rate || 1.0),
                    'Total (INR)': inv.total_amount * (inv.exchange_rate || 1.0),
                    'Currency': inv.currency || 'INR'
                }));
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(invData), "Detailed Invoices");

                XLSX.writeFile(wb, `GST_Full_Audit_${state.fy}_${new Date().toISOString().slice(0, 10)
                    }.xlsx`);
                api.notifications.show('Full Audit Exported (Excel)');
            },
            exportTableJSON: (type) => {
                let items = [];
                let filename = '';
                const myState = state.settings?.state;

                if (type === 'b2b') {
                    items = state.invoices.filter(inv => inv.type === 'Regular');
                    filename = 'GSTR1_B2B';
                } else if (type === 'b2cl') {
                    items = state.invoices.filter(inv => {
                        if (inv.type !== 'Without GST') return false;
                        const totalINR = inv.total_amount * (inv.exchange_rate || 1.0);
                        const custState = inv.customers?.state || '';
                        const isInterstate = myState && custState && myState !== custState;
                        return isInterstate && totalINR > 250000;
                    });
                    filename = 'GSTR1_B2C_Large';
                } else if (type === 'b2cs') {
                    items = state.invoices.filter(inv => {
                        if (inv.type !== 'Without GST') return false;
                        const totalINR = inv.total_amount * (inv.exchange_rate || 1.0);
                        const custState = inv.customers?.state || '';
                        const isInterstate = myState && custState && myState !== custState;
                        return !(isInterstate && totalINR > 250000);
                    });
                    filename = 'GSTR1_B2C_Small';
                } else if (type === 'exp') {
                    items = state.invoices.filter(inv => inv.type === 'LUT / Export');
                    filename = 'GSTR1_EXP';
                } else if (type === '3b') {
                    items = { sales: state.reports.sales, purchases: state.reports.purchases };
                    filename = 'GSTR3B_Summary';
                }

                const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${filename}_${state.fy}.json`;
                a.click();
                URL.revokeObjectURL(url);
                api.notifications.show('Data Exported (JSON)');
            },
            exportTableExcel: (type) => {
                let items = [];
                let filename = '';
                const myState = state.settings?.state;

                if (type === 'b2b') {
                    items = state.invoices.filter(inv => inv.type === 'Regular');
                    filename = 'GSTR1_B2B';
                } else if (type === 'b2cl') {
                    items = state.invoices.filter(inv => {
                        if (inv.type !== 'Without GST') return false;
                        const totalINR = inv.total_amount * (inv.exchange_rate || 1.0);
                        const custState = inv.customers?.state || '';
                        const isInterstate = myState && custState && myState !== custState;
                        return isInterstate && totalINR > 250000;
                    });
                    filename = 'GSTR1_B2C_Large';
                } else if (type === 'b2cs') {
                    items = state.invoices.filter(inv => {
                        if (inv.type !== 'Without GST') return false;
                        const totalINR = inv.total_amount * (inv.exchange_rate || 1.0);
                        const custState = inv.customers?.state || '';
                        const isInterstate = myState && custState && myState !== custState;
                        return !(isInterstate && totalINR > 250000);
                    });
                    filename = 'GSTR1_B2C_Small';
                } else if (type === 'exp') {
                    items = state.invoices.filter(inv => inv.type === 'LUT / Export');
                    filename = 'GSTR1_EXP';
                } else if (type === '3b') {
                    items = [
                        { 'Description': 'Outward Taxable Supplies', 'Taxable Value': state.reports.sales.taxable, 'Tax Amount': state.reports.sales.tax },
                        { 'Description': 'Eligible ITC (Purchases)', 'Taxable Value': state.reports.purchases.taxable, 'Tax Amount': state.reports.purchases.tax },
                        { 'Description': 'Net GST Payable', 'Taxable Value': '-', 'Tax Amount': Math.max(0, state.reports.sales.tax - state.reports.purchases.tax) }
                    ];
                    filename = 'GSTR3B_Summary';
                }

                const data = type === '3b' ? items : items.map(inv => ({
                    'Date': inv.date,
                    'Invoice No': inv.invoice_no,
                    'Customer': inv.customers?.name || 'Cash Sale',
                    'GSTIN': inv.customers?.gstin || '-',
                    'Taxable (INR)': inv.subtotal * (inv.exchange_rate || 1.0),
                    'Tax (INR)': (inv.total_amount - inv.subtotal) * (inv.exchange_rate || 1.0),
                    'Total (INR)': inv.total_amount * (inv.exchange_rate || 1.0)
                }));

                const ws = XLSX.utils.json_to_sheet(data);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Detailed Transactions");
                XLSX.writeFile(wb, `${filename}_Audit_${state.fy}.xlsx`);
                api.notifications.show('Data Exported (Excel)');
            },
            generateGSTR1: async () => {
                const monthEl = document.getElementById('gstr1-month');
                const fyEl = document.getElementById('gstr1-fy');

                const month = monthEl.value;
                const fy = fyEl.value;

                if (!month || !fy) {
                    alert('Please select both Month and Financial Year');
                    return;
                }

                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

                try {
                    // Filter invoices by month and FY
                    const filteredInvoices = state.invoices.filter(inv => {
                        if (!inv.date) return false;
                        const invDate = new Date(inv.date);
                        const invMonth = invDate.getMonth();
                        const invYear = invDate.getFullYear();

                        // Parse FY (e.g., "2024-25" means Apr 2024 to Mar 2025)
                        const [fyStart, fyEnd] = fy.split('-').map(y => parseInt('20' + y));

                        // Check if invoice is in selected FY
                        let inFY = false;
                        if (invMonth >= 3) { // Apr-Dec
                            inFY = invYear === fyStart;
                        } else { // Jan-Mar
                            inFY = invYear === fyEnd;
                        }

                        return inFY && invMonth === parseInt(month);
                    });

                    if (filteredInvoices.length === 0) {
                        alert(`No invoices found for ${monthNames[month]} ${fy} `);
                        return;
                    }

                    // Fetch invoice items for HSN summary
                    const invIds = filteredInvoices.map(i => i.id);
                    const { data: allItems } = await supabaseClient
                        .from('invoice_items')
                        .select('*, products(name)')
                        .in('invoice_id', invIds);

                    const myState = state.settings?.state;

                    // Categorize invoices
                    const b2b = [];
                    const b2cl = [];
                    const b2cs = [];
                    const exp = [];
                    const hsnDomestic = {};
                    const hsnExport = {};

                    const getCompanyStateCode = () => {
                        const s = state.settings?.state || '';
                        if (s && s.length >= 2 && /^\d/.test(s)) return s.substring(0, 2);
                        const g = state.settings?.gstin || '';
                        if (g && g.length >= 2 && /^\d/.test(g)) return g.substring(0, 2);
                        return '';
                    };
                    const myStateCode = getCompanyStateCode();

                    filteredInvoices.forEach(inv => {
                        const exRate = inv.exchange_rate || 1.0;
                        const totalINR = inv.total_amount * exRate;
                        const custState = String(inv.customers?.state || '');
                        const custStateCode = custState.substring(0, 2);
                        const isInterstate = myStateCode && custStateCode && myStateCode !== custStateCode;

                        if (inv.type === 'LUT / Export') {
                            exp.push(inv);
                        } else if (inv.type === 'Regular') {
                            b2b.push(inv);
                        } else if (inv.type === 'Without GST') {
                            if (isInterstate && totalINR > 250000) {
                                b2cl.push(inv);
                            } else {
                                b2cs.push(inv);
                            }
                        }
                    });

                    // Build HSN summary
                    if (allItems) {
                        allItems.forEach(item => {
                            const inv = filteredInvoices.find(i => i.id === item.invoice_id);
                            if (!inv) return;

                            const exRate = inv.exchange_rate || 1.0;
                            const hsnCode = item.hsn_code || 'N/A';
                            const custState = String(inv.customers?.state || '');
                            const custStateCode = custState.substring(0, 2);
                            const isInterstate = myStateCode && custStateCode && myStateCode !== custStateCode;

                            const isExport = inv.type === 'LUT / Export';
                            const hsnMap = isExport ? hsnExport : hsnDomestic;

                            if (!hsnMap[hsnCode]) {
                                hsnMap[hsnCode] = {
                                    code: hsnCode,
                                    desc: item.products?.name || 'Item',
                                    qty: 0,
                                    taxable: 0,
                                    igst: 0,
                                    cgst: 0,
                                    sgst: 0
                                };
                            }

                            const rowTaxable = (item.qty * item.rate * (1 - (item.discount || 0) / 100)) * exRate;
                            const prodMain = state.products.find(p => p.id === item.product_id);
                            const gstRate = (inv.type === 'Regular') ? (prodMain?.gst || 0) : 0;
                            const rowTax = (rowTaxable * gstRate) / 100;

                            hsnMap[hsnCode].qty += item.qty;
                            hsnMap[hsnCode].taxable += rowTaxable;

                            if (isInterstate || isExport) {
                                hsnMap[hsnCode].igst += rowTax;
                            } else {
                                hsnMap[hsnCode].cgst += rowTax / 2;
                                hsnMap[hsnCode].sgst += rowTax / 2;
                            }
                        });
                    }

                    // Aggregate B2CS by state and rate
                    const b2csAggregated = {};
                    b2cs.forEach(inv => {
                        const exRate = inv.exchange_rate || 1.0;
                        const taxable = inv.subtotal * exRate;
                        const tax = (inv.total_amount - inv.subtotal) * exRate;
                        const custState = inv.customers?.state || 'Unregistered';
                        const taxRate = taxable > 0 ? (tax / taxable * 100).toFixed(2) : "0.00";
                        const key = `${custState}_${taxRate} `;

                        if (!b2csAggregated[key]) {
                            b2csAggregated[key] = {
                                state: custState,
                                rate: taxRate,
                                taxable: 0,
                                igst: 0,
                                cgst: 0,
                                sgst: 0
                            };
                        }

                        b2csAggregated[key].taxable += taxable;

                        const invCustState = String(inv.customers?.state || '');
                        const invCustStateCode = invCustState.substring(0, 2);
                        const isInterstate = myStateCode && invCustStateCode && myStateCode !== invCustStateCode;

                        if (isInterstate) {
                            b2csAggregated[key].igst += tax;
                        } else {
                            b2csAggregated[key].cgst += tax / 2;
                            b2csAggregated[key].sgst += tax / 2;
                        }
                    });

                    // Store data and open modal
                    state.gstr1Data = {
                        period: `${monthNames[month]} ${fy} `,
                        month: monthNames[month],
                        fy: fy,
                        b2b: b2b,
                        b2cl: b2cl,
                        b2cs: Object.values(b2csAggregated),
                        exp: exp,
                        hsnDomestic: Object.values(hsnDomestic),
                        hsnExport: Object.values(hsnExport),
                        summary: {
                            b2b: b2b.reduce((s, i) => s + (i.total_amount * (i.exchange_rate || 1)), 0),
                            b2cl: b2cl.reduce((s, i) => s + (i.total_amount * (i.exchange_rate || 1)), 0),
                            b2cs: Object.values(b2csAggregated).reduce((s, i) => s + i.taxable + i.igst + i.cgst + i.sgst, 0),
                            exp: exp.reduce((s, i) => s + (i.total_amount * (i.exchange_rate || 1)), 0)
                        }
                    };

                    ui.modal.open('gstr1-preview', state.gstr1Data);

                } catch (err) {
                    console.error('GSTR-1 Generation Error:', err);
                    alert('Error generating GSTR-1: ' + err.message);
                }
            },
            downloadGSTR1Excel: () => {
                if (!state.gstr1Data) {
                    alert('Please generate GSTR-1 data first');
                    return;
                }

                const data = state.gstr1Data;
                const wb = XLSX.utils.book_new();
                const myState = state.settings?.state;

                // Create single consolidated sheet
                const ws_data = [];

                // ===== GSTR-1 Summary Section =====
                ws_data.push(['GSTR-1 Summary']);
                ws_data.push([]);
                ws_data.push(['Period', data.period]);
                ws_data.push(['Total Taxable Value', data.b2b.reduce((sum, inv) => sum + (inv.subtotal * (inv.exchange_rate || 1)), 0) +
                    data.b2cl.reduce((sum, inv) => sum + (inv.subtotal * (inv.exchange_rate || 1)), 0) +
                    data.b2cs.reduce((sum, entry) => sum + entry.taxable, 0) +
                    data.exp.reduce((sum, inv) => sum + (inv.subtotal * (inv.exchange_rate || 1)), 0)]);
                ws_data.push(['Total Tax', data.b2b.reduce((sum, inv) => sum + ((inv.total_amount - inv.subtotal) * (inv.exchange_rate || 1)), 0) +
                    data.b2cl.reduce((sum, inv) => sum + ((inv.total_amount - inv.subtotal) * (inv.exchange_rate || 1)), 0) +
                    data.b2cs.reduce((sum, entry) => sum + entry.igst + entry.cgst + entry.sgst, 0)]);
                ws_data.push([]);

                // ===== B2B Invoices Section =====
                ws_data.push(['B2B Invoices']);
                ws_data.push(['Invoice No.', 'Date', 'GSTIN', 'Customer Name', 'Place of Supply (State/UT Code)', 'Invoice Value', 'Taxable Value', 'IGST', 'CGST', 'SGST', 'Total GST']);

                const getCompanyStateCode = () => {
                    const s = state.settings?.state || '';
                    if (s && s.length >= 2 && /^\d/.test(s)) return s.substring(0, 2);
                    const g = state.settings?.gstin || '';
                    if (g && g.length >= 2 && /^\d/.test(g)) return g.substring(0, 2);
                    return '';
                };
                const myStateCode = getCompanyStateCode();

                data.b2b.forEach(inv => {
                    const exRate = inv.exchange_rate || 1.0;
                    const taxable = inv.subtotal * exRate;
                    const tax = (inv.total_amount - inv.subtotal) * exRate;
                    const custState = String(inv.customers?.state || '');
                    const custStateCode = custState.substring(0, 2);
                    const isInterstate = myStateCode && custStateCode && myStateCode !== custStateCode;

                    ws_data.push([
                        inv.invoice_no,
                        inv.date,
                        inv.customers?.gstin || '',
                        inv.customers?.name || 'Cash Sale',
                        custState,
                        inv.total_amount * exRate,
                        taxable,
                        isInterstate ? tax : 0,
                        isInterstate ? 0 : tax / 2,
                        isInterstate ? 0 : tax / 2,
                        tax
                    ]);
                });

                ws_data.push([]);
                ws_data.push([]);

                // ===== Summary: B2B (Aggregated) =====
                ws_data.push(['Summary - B2B (Aggregated)']);
                ws_data.push(['Total Invoices', data.b2b.length]);
                ws_data.push(['Total Taxable Value', data.b2b.reduce((sum, inv) => sum + (inv.subtotal * (inv.exchange_rate || 1)), 0)]);
                ws_data.push(['Total Tax', data.b2b.reduce((sum, inv) => sum + ((inv.total_amount - inv.subtotal) * (inv.exchange_rate || 1)), 0)]);
                ws_data.push([]);
                ws_data.push([]);

                // ===== B2C Invoices Section =====
                ws_data.push(['B2C Invoices - Large (>2.5L Interstate)']);
                ws_data.push(['Invoice No.', 'Date', 'Customer Name', 'Place of Supply', 'Invoice Value', 'Taxable Value', 'IGST']);

                data.b2cl.forEach(inv => {
                    const exRate = inv.exchange_rate || 1.0;
                    const taxable = inv.subtotal * exRate;
                    const tax = (inv.total_amount - inv.subtotal) * exRate;

                    ws_data.push([
                        inv.invoice_no,
                        inv.date,
                        inv.customers?.name || 'Cash Sale',
                        inv.customers?.state || '',
                        inv.total_amount * exRate,
                        taxable,
                        tax
                    ]);
                });

                ws_data.push([]);
                ws_data.push([]);

                // ===== B2C Small (Aggregated) =====
                ws_data.push(['B2C Invoices - Small (Aggregated by State & Rate)']);
                ws_data.push(['Place of Supply', 'Rate', 'Taxable Value', 'IGST', 'CGST', 'SGST']);

                data.b2cs.forEach(entry => {
                    ws_data.push([
                        entry.state,
                        entry.rate + '%',
                        entry.taxable,
                        entry.igst,
                        entry.cgst,
                        entry.sgst
                    ]);
                });

                ws_data.push([]);
                ws_data.push([]);

                // ===== Export Invoices Section =====
                ws_data.push(['Export Invoices']);
                ws_data.push(['Invoice No.', 'Date', 'Invoice Value (INR)', 'Taxable Value', 'Shipping Bill No.', 'Shipping Bill Date']);

                data.exp.forEach(inv => {
                    const exRate = inv.exchange_rate || 1.0;
                    ws_data.push([
                        inv.invoice_no,
                        inv.date,
                        inv.total_amount * exRate,
                        inv.subtotal * exRate,
                        '',
                        ''
                    ]);
                });

                ws_data.push([]);
                ws_data.push([]);

                // ===== HSN Summary Section - Domestic =====
                ws_data.push(['Section 12 - HSN Summary (Domestic)']);
                ws_data.push(['HSN/SAC', 'Description', 'UQC', 'Quantity', 'Taxable Value', 'IGST', 'CGST', 'SGST', 'Total GST']);

                data.hsnDomestic.forEach(h => {
                    ws_data.push([
                        h.code,
                        h.desc,
                        'NOS',
                        h.qty,
                        h.taxable,
                        h.igst,
                        h.cgst,
                        h.sgst,
                        h.igst + h.cgst + h.sgst
                    ]);
                });

                ws_data.push([]);
                ws_data.push([]);

                // ===== HSN Summary Section - Exports =====
                ws_data.push(['Section 12 - HSN Summary (Exports)']);
                ws_data.push(['HSN/SAC', 'Description', 'UQC', 'Quantity', 'Taxable Value', 'IGST', 'CGST', 'SGST', 'Total GST']);

                data.hsnExport.forEach(h => {
                    ws_data.push([
                        h.code,
                        h.desc,
                        'NOS',
                        h.qty,
                        h.taxable,
                        h.igst,
                        h.cgst,
                        h.sgst,
                        h.igst + h.cgst + h.sgst
                    ]);
                });

                // Create worksheet
                const ws = XLSX.utils.aoa_to_sheet(ws_data);

                // Set column widths
                ws['!cols'] = [
                    { wch: 20 }, // Column A
                    { wch: 12 }, // Column B
                    { wch: 18 }, // Column C
                    { wch: 25 }, // Column D
                    { wch: 20 }, // Column E
                    { wch: 15 }, // Column F
                    { wch: 15 }, // Column G
                    { wch: 12 }, // Column H
                    { wch: 12 }, // Column I
                    { wch: 12 }, // Column J
                    { wch: 12 }  // Column K
                ];

                XLSX.utils.book_append_sheet(wb, ws, `GSTR - 1 ${data.month.substring(0, 3)} -${data.fy.substring(2)} `);

                XLSX.writeFile(wb, `GSTR1_${data.month}_${data.fy} _Consolidated.xlsx`);
                api.notifications.show('GSTR-1 Consolidated Excel Downloaded!', 'success');
            }
        },
        invoice: {
            activeId: null,

            filterCustomers: (query) => {
                const results = document.getElementById('inv-customer-results');
                if (!query) {
                    results.classList.add('hidden');
                    return;
                }
                const filtered = state.customers.filter(c =>
                    c.name.toLowerCase().includes(query.toLowerCase()) ||
                    (c.company && c.company.toLowerCase().includes(query.toLowerCase()))
                );
                if (filtered.length > 0) {
                    results.innerHTML = filtered.map(c => `
                        <div class="customer-result-item" onclick="ui.invoice.selectCustomer('${c.id}', '${c.name.replace(/'/g, "\\'")}')">
                            <div class="item-info">
                                <span class="customer-name">${c.name}</span>
                                <span class="customer-meta">${c.company || 'Individual'}</span>
                            </div>
                            <div class="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                                ${c.city || 'Local'}
                            </div>
                        </div>
                    `).join('');
                    results.classList.remove('hidden');
                } else {
                    results.innerHTML = '<div class="p-4 text-xs font-bold text-slate-400">No customers found</div>';
                    results.classList.remove('hidden');
                }
            },

            selectCustomer: (id, name) => {
                document.getElementById('inv-customer').value = id;
                document.getElementById('inv-customer-search').value = name;
                document.getElementById('inv-customer-results').classList.add('hidden');
                ui.invoice.updateCalculations();
            },

            updateDocNo: async () => {
                const dateInput = document.getElementById('inv-date');
                const noInput = document.getElementById('inv-no');
                if (!dateInput || !noInput) return;

                const selectedDate = new Date(dateInput.value);
                const year = selectedDate.getFullYear();
                const month = selectedDate.getMonth();

                let fyStart, fyEnd;
                if (month < 3) { // Jan-Mar
                    fyStart = year - 1;
                    fyEnd = year;
                } else { // Apr-Dec
                    fyStart = year;
                    fyEnd = year + 1;
                }

                try {
                    const { data, error } = await supabaseClient
                        .from('invoices')
                        .select('invoice_no')
                        .gte('date', `${fyStart}-04-01`)
                        .lte('date', `${fyEnd}-03-31`)
                        .order('invoice_no', { ascending: false })
                        .limit(1);

                    if (error) throw error;

                    let nextSeq = 1;
                    if (data && data.length > 0 && data[0].invoice_no) {
                        const match = data[0].invoice_no.match(/-(\d+)$/);
                        if (match) nextSeq = parseInt(match[1]) + 1;
                    }

                    const newDocNo = `LGS-INV-${fyStart}-${String(fyEnd).slice(-2)}-${String(nextSeq).padStart(3, '0')}`;
                    noInput.value = newDocNo;
                } catch (err) {
                    console.error('Error generating Invoice number:', err);
                    noInput.value = `LGS-INV-${fyStart}-${String(fyEnd).slice(-2)}-001`;
                }
            },

            addItem: (data = null) => {
                const id = Date.now().toString() + Math.random().toString().slice(2, 5);
                const container = document.getElementById('inv-line-items');
                if (!container) return;

                document.getElementById('inv-empty-state')?.classList.add('hidden');

                const row = document.createElement('tr');
                row.className = 'border-b border-slate-100 hover:bg-slate-50/50 transition-colors group';
                row.id = `inv-item-${id}`;
                row.innerHTML = `
            <td class="p-3">
        <div class="product-search-container">
            <input type="text" class="form-input text-xs font-bold bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-300 w-full item-search"
                placeholder="Search product..."
                oninput="ui.invoice.filterProducts('${id}', this.value)"
                value="${data?.product_name || ''}">
                <input type="hidden" class="item-product-id" value="${data?.product_id || ''}">
                    <div class="product-results-list hidden" id="results-${id}"></div>
                </div>
            </td>
            <td class="p-3"><input type="text" class="text-xs font-mono text-slate-400 bg-transparent border-none p-0 focus:ring-0 item-hsn w-full" value="${data?.hsn || ''}" readonly tabindex="-1"></td>
            <td class="p-3"><input type="number" class="w-full text-center text-xs font-bold bg-slate-50 border border-slate-200 rounded py-1 item-qty" value="${data?.qty || 1}" oninput="ui.invoice.updateCalculations()"></td>
            <td class="p-3"><input type="number" class="w-full text-xs font-bold bg-transparent border-none p-0 focus:ring-0 item-rate" value="${data?.rate || 0}" oninput="ui.invoice.updateCalculations()"></td>
            <td class="p-3"><input type="number" class="w-full text-center text-xs font-bold bg-transparent border-none p-0 focus:ring-0 item-discount" value="${data?.discount || 0}" oninput="ui.invoice.updateCalculations()"></td>
            <td class="p-3"><span class="text-xs font-bold text-slate-400 tabular-nums row-total-with-tax">₹0.00</span></td>
            <td class="p-3 text-right"><span class="text-xs font-black text-slate-900 tabular-nums row-total">₹0.00</span></td>
            <td class="p-3 text-center">
                <button onclick="ui.invoice.removeItem('${id}')" class="p-1 text-slate-200 hover:text-red-500 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </td>
            `;
                container.appendChild(row);
                ui.invoice.updateCalculations();
            },

            filterProducts: (rowId, query) => {
                const results = document.getElementById(`results-${rowId}`);
                if (!query) {
                    results.classList.add('hidden');
                    return;
                }
                const filtered = state.products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
                if (filtered.length > 0) {
                    results.innerHTML = filtered.map(p => `
                        <div class="product-result-item" onclick="ui.invoice.selectProduct('${rowId}', '${p.id}', '${p.name.replace(/'/g, "\\'")}', '${p.hsn || ''}', ${p.price})">
                            <div class="item-info">
                                <div class="product-name">${p.name}</div>
                                <div class="product-meta text-slate-400">HSN: ${p.hsn || '-'}</div>
                            </div>
                            <div class="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-900 tabular-nums">
                                ₹${p.price.toLocaleString()}
                            </div>
                        </div>
                    `).join('');
                    results.classList.remove('hidden');
                } else {
                    results.innerHTML = '<div class="p-4 text-xs font-bold text-slate-400">No products found</div>';
                    results.classList.remove('hidden');
                }
            },

            selectProduct: (rowId, productId, name, hsn, price) => {
                const row = document.getElementById(`inv-item-${rowId}`);
                row.querySelector('.item-search').value = name;
                row.querySelector('.item-product-id').value = productId;
                row.querySelector('.item-hsn').value = hsn;
                row.querySelector('.item-rate').value = price;
                document.getElementById(`results-${rowId}`).classList.add('hidden');
                ui.invoice.updateCalculations();
            },

            removeItem: (id) => {
                document.getElementById(`inv-item-${id}`).remove();
                if (document.querySelectorAll('#inv-line-items tr').length === 0) {
                    document.getElementById('inv-empty-state').classList.remove('hidden');
                }
                ui.invoice.updateCalculations();
            },

            addCustomField: (name = '', value = '') => {
                const id = Date.now().toString() + Math.random().toString().slice(2, 5);
                const container = document.getElementById('inv-custom-fields');
                const div = document.createElement('div');
                div.className = 'flex gap-3 items-center group bg-white p-2 rounded-lg border border-slate-100';
                div.id = `inv-cf-${id}`;
                div.innerHTML = `
            <input type="text" class="form-input text-sm inv-cf-name w-1/3 bg-transparent border-none font-bold placeholder:text-slate-300" placeholder="Label" value="${name}">
                <input type="text" class="form-input text-sm inv-cf-value flex-1 bg-transparent border-none font-bold placeholder:text-slate-300" placeholder="Value" value="${value}">
                    <button onclick="this.parentElement.remove()" class="p-1 text-slate-200 hover:text-red-500"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                    `;
                container.appendChild(div);
            },

            toggleExportFields: () => {
                const type = document.getElementById('inv-type')?.value || 'Regular';
                const exportDiv = document.getElementById('inv-export-fields');
                const bankChargesDiv = document.getElementById('inv-bank-charges-container');
                const bankChargesInput = document.getElementById('inv-bank-charges');

                if (type === 'LUT / Export') {
                    exportDiv.classList.remove('hidden');
                    if (bankChargesDiv) bankChargesDiv.classList.remove('hidden');

                    const currencySelect = document.getElementById('inv-currency');
                    if (currencySelect.value === 'INR') currencySelect.value = 'USD';
                    const exRateEl = document.getElementById('inv-exchange-rate');
                    if (exRateEl && (!exRateEl.value || parseFloat(exRateEl.value) === 0)) exRateEl.value = '1.00';
                } else {
                    exportDiv.classList.add('hidden');
                    if (bankChargesDiv) bankChargesDiv.classList.add('hidden');
                    if (bankChargesInput) bankChargesInput.value = 0;

                    const exRateEl = document.getElementById('inv-exchange-rate');
                    if (exRateEl) exRateEl.value = '1.00';
                }
                ui.invoice.updateCalculations();
            },

            loadDefaultTerms: () => {
                const terms = state.settings?.default_invoice_terms || "1. Goods once sold will not be taken back.\n2. Payment should be made within 15 days.\n3. All disputes are subject to local jurisdiction.";
                document.getElementById('inv-notes').value = terms;
            },

            updateCalculations: () => {
                const customerId = document.getElementById('inv-customer')?.value;
                const customer = state.customers.find(c => c.id === customerId);
                const currency = document.getElementById('inv-currency')?.value || 'INR';
                const type = document.getElementById('inv-type')?.value || 'Regular';

                const symbol = { 'INR': '₹', 'USD': '$', 'EUR': '€' }[currency];
                const loc = currency === 'USD' ? 'en-US' : 'en-IN';

                // Helper function to extract state code
                const getStateCode = (val, gstinFallback) => {
                    // 1. Try specified value (e.g. "27 - Maharashtra")
                    if (val) {
                        const str = String(val);
                        const code = str.includes('-') ? str.split('-')[0].trim() : str.trim();
                        if (code && code.length === 2 && !isNaN(code)) return code;
                    }
                    // 2. Try GSTIN fallback (first 2 digits)
                    if (gstinFallback) {
                        const code = String(gstinFallback).substring(0, 2);
                        if (code && code.length === 2 && !isNaN(code)) return code;
                    }
                    return '27'; // Final fallback
                };

                const myStateCode = getStateCode(state.settings?.state, state.settings?.gstin);
                const customerStateCode = getStateCode(customer?.state, customer?.gstin);
                const isInterState = customer && customerStateCode !== myStateCode;

                let taxableAmount = 0;
                let taxes = {};

                document.querySelectorAll('#inv-line-items tr').forEach(row => {
                    const productId = row.querySelector('.item-product-id').value;
                    const product = state.products.find(p => p.id === productId);
                    const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
                    const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
                    const discPct = parseFloat(row.querySelector('.item-discount').value) || 0;

                    const totalBeforeDisc = qty * rate;
                    const discAmount = (totalBeforeDisc * discPct) / 100;
                    let taxable = totalBeforeDisc - discAmount;

                    taxableAmount += taxable;
                    row.querySelector('.row-total').textContent = `${symbol}${taxable.toLocaleString(loc, { minimumFractionDigits: 2 })}`;

                    let taxAmount = 0;
                    if (product && type === 'Regular') {
                        const gstRate = product.gst || 0;
                        taxAmount = Math.round((taxable * gstRate) * 100) / 10000;

                        if (isInterState) {
                            taxes['IGST'] = Math.round(((taxes['IGST'] || 0) + taxAmount) * 100) / 100;
                        } else {
                            taxes['CGST'] = Math.round(((taxes['CGST'] || 0) + (taxAmount / 2)) * 100) / 100;
                            taxes['SGST'] = Math.round(((taxes['SGST'] || 0) + (taxAmount / 2)) * 100) / 100;
                        }
                    }
                    row.querySelector('.row-total-with-tax').textContent = `${symbol}${(taxable + taxAmount).toLocaleString(loc, { minimumFractionDigits: 2 })}`;
                });

                document.getElementById('inv-sum-taxable').textContent = `${symbol}${taxableAmount.toLocaleString(loc, { minimumFractionDigits: 2 })}`;

                const taxBody = document.getElementById('inv-tax-rows');
                taxBody.innerHTML = '';
                let totalTax = 0;
                Object.entries(taxes).forEach(([name, amt]) => {
                    totalTax += amt;
                    taxBody.innerHTML += `
                    <div class="flex justify-between items-center text-xs font-bold">
                        <span class="text-slate-400">${name}</span>
                        <span class="text-slate-900">${symbol}${amt.toLocaleString(loc, { minimumFractionDigits: 2 })}</span>
                    </div>
                    `;
                });

                const bankCharges = parseFloat(document.getElementById('inv-bank-charges')?.value) || 0;
                const grandTotal = taxableAmount + totalTax + bankCharges;
                document.getElementById('inv-sum-total').textContent = `${symbol}${grandTotal.toLocaleString(loc, { minimumFractionDigits: 2 })}`;
                document.getElementById('inv-footer-total').textContent = `${symbol}${grandTotal.toLocaleString(loc, { minimumFractionDigits: 2 })}`;
            },

            edit: async (id) => {
                try {
                    const { data: inv, error } = await supabaseClient
                        .from('invoices')
                        .select('*, invoice_items(*, products(name))')
                        .eq('id', id)
                        .single();

                    if (error) throw error;

                    ui.invoice.activeId = inv.id;
                    ui.modal.open('invoice');

                    // Wait for modal to render
                    setTimeout(() => {
                        document.getElementById('inv-no').value = inv.invoice_no;
                        document.getElementById('inv-date').value = inv.date;
                        if (inv.due_date) document.getElementById('inv-due-date').value = inv.due_date;
                        document.getElementById('inv-customer').value = inv.customer_id;
                        document.getElementById('inv-customer-search').value = inv.customers?.name || '';
                        document.getElementById('inv-type').value = inv.type || 'Regular';
                        if (document.getElementById('inv-currency')) document.getElementById('inv-currency').value = inv.currency || 'INR';
                        if (document.getElementById('inv-exchange-rate')) document.getElementById('inv-exchange-rate').value = inv.exchange_rate || 1.0;
                        document.getElementById('inv-bank').value = inv.bank_id || 'inr';
                        document.getElementById('inv-purchase-no').value = inv.purchase_no || '';
                        if (inv.purchase_date) document.getElementById('inv-purchase-date').value = inv.purchase_date;
                        document.getElementById('inv-notes').value = inv.notes || '';
                        if (document.getElementById('inv-bank-charges')) document.getElementById('inv-bank-charges').value = inv.bank_charges || 0;

                        // Custom Fields
                        if (inv.custom_fields && Array.isArray(inv.custom_fields)) {
                            inv.custom_fields.forEach(cf => ui.invoice.addCustomField(cf.name, cf.value));
                        }

                        // Line Items
                        const container = document.getElementById('inv-line-items');
                        container.innerHTML = '';
                        if (inv.invoice_items && inv.invoice_items.length > 0) {
                            inv.invoice_items.forEach(item => {
                                ui.invoice.addItem({
                                    product_id: item.product_id,
                                    product_name: item.products?.name || '',
                                    hsn: item.hsn_code || '',
                                    qty: item.qty,
                                    rate: item.rate,
                                    discount: item.discount || 0
                                });
                            });
                        }

                        ui.invoice.toggleExportFields();
                        ui.invoice.updateCalculations();
                    }, 500);

                } catch (err) {
                    console.error('Edit Error:', err);
                    alert('Failed to load invoice: ' + err.message);
                }
            }
        },
        purchase: {
            addItem: () => {
                const id = Date.now().toString();
                const container = document.getElementById('pur-line-items');
                if (!container) return;
                const row = document.createElement('div');
                row.className = 'line-item-row';
                row.id = `pur-item-${id}`;
                row.innerHTML = `
                    <select class="form-input pur-item-select" onchange="ui.purchase.onItemSelect('${id}', this.value)">
                        <option value="">Select Item...</option>
                        ${state.products.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                    </select>
                    <input type="number" class="form-input pur-item-qty" value="1" oninput="ui.purchase.updateCalculations()">
                        <input type="number" class="form-input pur-item-rate" value="0" oninput="ui.purchase.updateCalculations()">
                            <span class="text-right font-bold text-slate-700 pur-item-total">₹0.00</span>
                            <button onclick="ui.purchase.removeItem('${id}')" class="remove-item">✕</button>
                            `;
                container.appendChild(row);
                ui.purchase.updateCalculations();
            },
            removeItem: (id) => {
                const row = document.getElementById(`pur-item-${id}`);
                if (row) row.remove();
                ui.purchase.updateCalculations();
            },
            onItemSelect: (rowId, productId) => {
                const product = state.products.find(p => p.id === productId);
                if (product) {
                    const row = document.getElementById(`pur-item-${rowId}`);
                    if (row) {
                        row.querySelector('.pur-item-rate').value = product.price;
                        ui.purchase.updateCalculations();
                    }
                }
            },
            updateCalculations: () => {
                let subtotal = 0;
                let taxTotal = 0;

                document.querySelectorAll('.line-item-row:not(.bg-slate-50)').forEach(row => {
                    const select = row.querySelector('.pur-item-select');
                    if (!select) return; // Skip sales rows if open simultaneously

                    const productId = select.value;
                    const product = state.products.find(p => p.id === productId);
                    const qty = parseFloat(row.querySelector('.pur-item-qty').value) || 0;
                    const rate = parseFloat(row.querySelector('.pur-item-rate').value) || 0;
                    const amount = qty * rate;

                    subtotal += amount;
                    row.querySelector('.pur-item-total').textContent = `₹${amount.toLocaleString()}`;

                    if (product) {
                        const gstRate = product.gst || 0;
                        taxTotal += (amount * gstRate) / 100;
                    }
                });

                document.getElementById('pur-subtotal').textContent = `₹${subtotal.toLocaleString()}`;
                document.getElementById('pur-tax').textContent = `₹${taxTotal.toLocaleString()}`;
                document.getElementById('pur-total').textContent = `₹${(subtotal + taxTotal).toLocaleString()}`;
            }
        },
        doc: {
            addItem: () => {
                const id = Date.now().toString();
                const container = document.getElementById('doc-line-items');
                if (!container) return;
                const row = document.createElement('div');
                row.className = 'line-item-row';
                row.id = `doc-item-${id}`;
                row.innerHTML = `
                            <select class="form-input doc-item-select" onchange="ui.doc.onItemSelect('${id}', this.value)">
                                <option value="">Select Item...</option>
                                ${state.products.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                            </select>
                            <input type="number" class="form-input doc-item-qty" value="1" oninput="ui.doc.updateCalculations()">
                                <input type="number" class="form-input doc-item-rate" value="0" oninput="ui.doc.updateCalculations()">
                                    <span class="text-right font-bold text-slate-700 doc-item-total">₹0.00</span>
                                    <button onclick="ui.doc.removeItem('${id}')" class="remove-item">✕</button>
                                    `;
                container.appendChild(row);
                ui.doc.updateCalculations();
            },
            removeItem: (id) => {
                const row = document.getElementById(`doc-item-${id}`);
                if (row) row.remove();
                ui.doc.updateCalculations();
            },
            onItemSelect: (rowId, productId) => {
                const product = state.products.find(p => p.id === productId);
                if (product) {
                    const row = document.getElementById(`doc-item-${rowId}`);
                    if (row) {
                        row.querySelector('.doc-item-rate').value = product.price;
                        ui.doc.updateCalculations();
                    }
                }
            },
            updateCalculations: () => {
                let subtotal = 0;
                document.querySelectorAll('.doc-item-select').forEach(select => {
                    const row = select.closest('.line-item-row');
                    const qty = parseFloat(row.querySelector('.doc-item-qty').value) || 0;
                    const rate = parseFloat(row.querySelector('.doc-item-rate').value) || 0;
                    const amount = qty * rate;
                    subtotal += amount;
                    row.querySelector('.doc-item-total').textContent = `₹${amount.toLocaleString()}`;
                });
                if (document.getElementById('doc-subtotal')) {
                    document.getElementById('doc-subtotal').textContent = `₹${subtotal.toLocaleString()}`;
                    document.getElementById('doc-total').textContent = `₹${subtotal.toLocaleString()}`; // Pre-sales usually show totals without tax breakdown in modal preview
                }
            }
        },
        proforma_v2: {
            activeId: null,
            activeStatus: null,

            filterCustomers: (query) => {
                const results = document.getElementById('pfi-customer-results');
                if (!query) {
                    results.classList.add('hidden');
                    return;
                }

                const filtered = state.customers.filter(c =>
                    c.name.toLowerCase().includes(query.toLowerCase()) ||
                    (c.company && c.company.toLowerCase().includes(query.toLowerCase()))
                );

                if (filtered.length > 0) {
                    results.innerHTML = filtered.map(c => `
                        <div class="customer-result-item" onclick="ui.proforma_v2.selectCustomer('${c.id}', '${c.name.replace(/'/g, "\\'")}')">
                            <div class="item-info">
                                <span class="customer-name">${c.name}</span>
                                <span class="customer-meta">${c.company || 'Individual'}</span>
                            </div>
                            <div class="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                                ${c.city || 'Local'}
                            </div>
                        </div>
                    `).join('');
                    results.classList.remove('hidden');
                } else {
                    results.innerHTML = '<div class="p-4 text-xs font-bold text-slate-400">No customers found</div>';
                    results.classList.remove('hidden');
                }
            },

            selectCustomer: (id, name) => {
                document.getElementById('pfi-customer').value = id;
                document.getElementById('pfi-customer-search').value = name;
                document.getElementById('pfi-customer-results').classList.add('hidden');
                ui.proforma_v2.updateCalculations();
            },

            updateDocNo: async () => {
                const dateInput = document.getElementById('pfi-date');
                const noInput = document.getElementById('pfi-no');
                if (!dateInput || !noInput || ui.proforma_v2.activeId) return;

                const selectedDate = new Date(dateInput.value);
                const year = selectedDate.getFullYear();
                const month = selectedDate.getMonth(); // 0-indexed, April is 3

                // Determine FY based on selected date
                let fyStart, fyEnd;
                if (month < 3) { // Jan-Mar (months 0-2)
                    fyStart = year - 1;
                    fyEnd = year;
                } else { // Apr-Dec (months 3-11)
                    fyStart = year;
                    fyEnd = year + 1;
                }

                try {
                    // Query last PFI number for this FY
                    const { data, error } = await supabaseClient
                        .from('proforma_invoices')
                        .select('doc_no')
                        .gte('date', `${fyStart}-04-01`)
                        .lte('date', `${fyEnd}-03-31`)
                        .order('doc_no', { ascending: false })
                        .limit(1);

                    if (error) throw error;

                    let nextSeq = 1;
                    if (data && data.length > 0 && data[0].doc_no) {
                        // Extract sequence from last doc_no (e.g., "LGS-PFI-2025-26-123" -> 123)
                        const match = data[0].doc_no.match(/-(\d+)$/);
                        if (match) {
                            nextSeq = parseInt(match[1]) + 1;
                        }
                    }

                    const newDocNo = `LGS-PFI-${fyStart}-${String(fyEnd).slice(-2)}-${String(nextSeq).padStart(3, '0')}`;
                    noInput.value = newDocNo;
                } catch (err) {
                    console.error('Error generating PFI number:', err);
                    // Fallback to a basic format if query fails
                    noInput.value = `LGS-PFI-${fyStart}-${String(fyEnd).slice(-2)}-001`;
                }
            },

            addCustomField: (name = '', value = '') => {
                const id = Date.now().toString();
                const container = document.getElementById('pfi-custom-fields');
                if (!container) return;
                const div = document.createElement('div');
                div.className = 'flex gap-3 items-center group animate-slide-up bg-white p-2 rounded-lg border border-slate-100';
                div.id = `cf-${id}`;
                div.innerHTML = `
                                    <input type="text" class="form-input text-sm cf-name w-1/3 bg-transparent border-none font-bold placeholder:text-slate-300" placeholder="Label" value="${name}">
                                        <div class="w-px h-4 bg-slate-200"></div>
                                        <input type="text" class="form-input text-sm cf-value flex-1 bg-transparent border-none font-medium placeholder:text-slate-300" placeholder="Value" value="${value}">
                                            <button onclick="ui.proforma_v2.removeCustomField('${id}')" class="text-slate-300 hover:text-red-500 transition-colors">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                            `;
                container.appendChild(div);
            },
            removeCustomField: (id) => {
                const row = document.getElementById(`cf-${id}`);
                if (row) row.remove();
            },

            toggleHeaderField: (fieldId) => {
                const field = document.getElementById(fieldId);
                const btn = document.querySelector(`[onclick*="${fieldId}"]`);
                if (field) {
                    field.classList.toggle('hidden');
                    if (btn) btn.classList.toggle('active');
                }
            },

            filterProducts: (rowId, query) => {
                const results = document.getElementById(`results-${rowId}`);
                if (!results) return;

                if (!query) {
                    results.classList.add('hidden');
                    return;
                }

                const filtered = state.products.filter(p =>
                    p.name.toLowerCase().includes(query.toLowerCase()) ||
                    (p.sku && p.sku.toLowerCase().includes(query.toLowerCase()))
                ).slice(0, 5);

                if (filtered.length === 0) {
                    results.innerHTML = `<div class="p-4 text-xs font-bold text-slate-400">No products found</div>`;
                } else {
                    results.innerHTML = filtered.map(p => `
                        <div class="product-result-item" onclick="ui.proforma_v2.selectProduct('${rowId}', '${p.id}', '${p.name.replace(/'/g, "\\'")}')">
                            <div class="item-info">
                                <span class="product-name">${p.name}</span>
                                <span class="product-meta">SKU: ${p.sku || 'No SKU'}</span>
                            </div>
                            <div class="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-900 tabular-nums">
                                ₹${p.price.toLocaleString()}
                            </div>
                        </div>
                    `).join('');
                }
                results.classList.remove('hidden');
            },

            selectProduct: (rowId, productId, productName) => {
                const row = document.getElementById(`item-${rowId}`);
                if (row) {
                    row.querySelector('.product-search-input').value = productName;
                    row.querySelector('.product-id-hidden').value = productId;
                    document.getElementById(`results-${rowId}`).classList.add('hidden');
                    ui.proforma_v2.onItemSelect(rowId, productId);
                }
            },



            addItem: () => {
                const id = Date.now().toString();
                const container = document.getElementById('pfi-line-items');
                const emptyState = document.getElementById('pfi-empty-state');
                if (!container) return;

                if (emptyState) emptyState.classList.add('hidden');

                const row = document.createElement('tr');
                row.id = `item-${id}`;
                row.innerHTML = `
                                            <td class="p-4">
                                                <div class="product-search-container">
                                                    <input type="text"
                                                        class="form-input text-sm product-search-input w-full bg-transparent border-none font-bold focus:ring-0"
                                                        placeholder="Search product..."
                                                        oninput="ui.proforma_v2.filterProducts('${id}', this.value)"
                                                        autocomplete="off">
                                                        <input type="hidden" class="product-id-hidden">
                                                            <div id="results-${id}" class="product-results-list hidden"></div>
                                                        </div>
                                                    </td>
                                                    <td class="p-4">
                                                        <input type="text" class="form-input text-sm hsn-input w-full bg-slate-50 border-none rounded-lg font-bold" placeholder="HSN/SAC">
                                                    </td>
                                                    <td class="p-4">
                                                        <input type="number" class="form-input text-sm qty-input w-full bg-slate-50 border-none rounded-lg text-center font-bold" value="1" min="1" oninput="ui.proforma_v2.updateCalculations()">
                                                    </td>
                                                    <td class="p-4">
                                                        <input type="number" class="form-input text-sm rate-input w-full bg-transparent border-none font-bold" value="0" min="0" oninput="ui.proforma_v2.updateCalculations()">
                                                    </td>
                                                    <td class="p-4">
                                                        <input type="number" class="form-input text-sm discount-input w-full bg-slate-50 border-none rounded-lg text-center font-bold" value="0" min="0" max="100" oninput="ui.proforma_v2.updateCalculations()">
                                                    </td>
                                                    <td class="p-4">
                                                        <div class="tax-text text-[10px] font-bold text-slate-400">-</div>
                                                        <div class="text-[10px] font-bold text-slate-900 border-t border-slate-100 mt-1 pt-1 row-total-with-tax">₹0.00</div>
                                                    </td>
                                                    <td class="p-4 text-right">
                                                        <div class="row-total text-sm font-black text-slate-900 tabular-nums">₹0.00</div>
                                                    </td>
                                                    <td class="p-4 text-center">
                                                        <button onclick="ui.proforma_v2.removeItem('${id}')" class="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                        </button>
                                                    </td>
                                                    `;
                container.appendChild(row);
                ui.proforma_v2.updateCalculations();
            },
            removeItem: (id) => {
                const row = document.getElementById(`item-${id}`);
                if (row) row.remove();

                const container = document.getElementById('pfi-line-items');
                const emptyState = document.getElementById('pfi-empty-state');
                if (container && container.children.length === 0 && emptyState) {
                    emptyState.classList.remove('hidden');
                }

                ui.proforma_v2.updateCalculations();
            },
            onItemSelect: (rowId, productId) => {
                const product = state.products.find(p => p.id === productId);
                const row = document.getElementById(`item-${rowId}`);
                if (product && row) {
                    row.querySelector('.rate-input').value = product.price;
                    row.querySelector('.hsn-input').value = product.hsn || '';
                    ui.proforma_v2.updateCalculations();
                }
            },
            toggleExportFields: () => {
                const type = document.getElementById('pfi-type')?.value;
                const exportDiv = document.getElementById('pfi-export-fields');
                const currencyEl = document.getElementById('pfi-currency');
                const bankChargesDiv = document.getElementById('pfi-bank-charges-container');
                const bankChargesInput = document.getElementById('pfi-bank-charges');

                if (type === 'LUT / Export') {
                    if (exportDiv) {
                        exportDiv.classList.remove('hidden');
                        exportDiv.classList.add('block');
                    }
                    if (bankChargesDiv) bankChargesDiv.classList.remove('hidden');
                    if (currencyEl && currencyEl.value === 'INR') {
                        currencyEl.value = 'USD';
                    }
                } else {
                    if (exportDiv) {
                        exportDiv.classList.remove('block');
                        exportDiv.classList.add('hidden');
                    }
                    if (bankChargesDiv) bankChargesDiv.classList.add('hidden');
                    if (bankChargesInput) bankChargesInput.value = 0;
                }
                ui.proforma_v2.updateCalculations();
            },

            loadDefaultTerms: () => {
                document.getElementById('pfi-terms').value = `1. Payment: 100% advance along with purchase order.\n2. Delivery: Within 2-3 weeks from the date of receipt of advance.\n3. Validity: This Pro Forma Invoice is valid for 7 days.\n4. Taxes: GST as applicable.\n5. Order once placed cannot be cancelled.`;
            },
            updateCalculations: () => {
                const customerId = document.getElementById('pfi-customer')?.value;
                const customer = state.customers.find(c => c.id === customerId);
                const pfiType = document.getElementById('pfi-type')?.value;

                const getStateCode = (val, gstinFallback) => {
                    if (val) {
                        const str = String(val);
                        const code = str.includes('-') ? str.split('-')[0].trim() : str.trim();
                        if (code && code.length === 2 && !isNaN(code)) return code;
                    }
                    if (gstinFallback) {
                        const code = String(gstinFallback).substring(0, 2);
                        if (code && code.length === 2 && !isNaN(code)) return code;
                    }
                    return '27';
                };

                const myStateCode = getStateCode(state.settings?.state, state.settings?.gstin);
                const customerStateCode = getStateCode(customer?.state, customer?.gstin);
                const isInterState = customer && customerStateCode !== myStateCode;

                const currency = document.getElementById('pfi-currency')?.value || 'INR';
                const symbol = { 'INR': '₹', 'USD': '$', 'EUR': '€' }[currency];

                let taxableTotal = 0;
                let taxesTotal = 0;
                let totalDiscount = 0;
                let taxBreakdown = {};

                document.querySelectorAll('#pfi-line-items tr').forEach(row => {
                    const productId = row.querySelector('.product-id-hidden').value;
                    const product = state.products.find(p => p.id === productId);
                    const qty = parseFloat(row.querySelector('.qty-input').value) || 0;
                    const rate = parseFloat(row.querySelector('.rate-input').value) || 0;
                    const discPct = parseFloat(row.querySelector('.discount-input').value) || 0;

                    const baseAmount = qty * rate;
                    const discount = (baseAmount * discPct) / 100;
                    const baseTaxable = baseAmount - discount;

                    totalDiscount += discount;
                    const taxable = baseAmount - discount;

                    taxableTotal += taxable;

                    let gstRate = (product && pfiType === 'Regular') ? (product.gst || 0) : 0;
                    if (pfiType === 'LUT / Export' || pfiType === 'Without GST') gstRate = 0;

                    const taxAmount = Math.round((taxable * gstRate) * 100) / 10000;
                    taxesTotal += taxAmount;

                    if (gstRate > 0) {
                        if (isInterState) {
                            taxBreakdown['IGST'] = Math.round(((taxBreakdown['IGST'] || 0) + taxAmount) * 100) / 100;
                            row.querySelector('.tax-text').textContent = `IGST ${gstRate}%`;
                        } else {
                            const halfTax = taxAmount / 2;
                            taxBreakdown['CGST'] = Math.round(((taxBreakdown['CGST'] || 0) + halfTax) * 100) / 100;
                            taxBreakdown['SGST'] = Math.round(((taxBreakdown['SGST'] || 0) + halfTax) * 100) / 100;
                            row.querySelector('.tax-text').textContent = `CGST/SGST ${gstRate / 2}%`;
                        }
                    } else {
                        row.querySelector('.tax-text').textContent = pfiType === 'Regular' ? '0% GST' : pfiType;
                    }

                    row.querySelector('.row-total').textContent = `${symbol}${taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                    if (row.querySelector('.row-total-with-tax')) {
                        row.querySelector('.row-total-with-tax').textContent = `${symbol}${(taxable + taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                    }
                });

                if (document.getElementById('pfi-sum-discount')) {
                    document.getElementById('pfi-sum-discount').textContent = `Total Discount: ${symbol}${totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                }

                const bankCharges = parseFloat(document.getElementById('pfi-bank-charges')?.value) || 0;
                const finalTotal = taxableTotal + taxesTotal + bankCharges;
                document.getElementById('pfi-sum-taxable').textContent = `${symbol}${taxableTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                document.getElementById('pfi-sum-total').textContent = `${symbol}${finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                if (document.getElementById('pfi-footer-total')) {
                    document.getElementById('pfi-footer-total').textContent = `${symbol}${finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                }

                const taxRowsContent = Object.entries(taxBreakdown).map(([name, val]) => `
                                                    <div class="flex justify-between items-center text-slate-500 font-bold text-xs">
                                                        <span>${name}</span>
                                                        <span>${symbol}${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                    `).join('');
                document.getElementById('pfi-tax-rows').innerHTML = taxRowsContent;
            },
            save: async (isDraft = false, print = false) => {
                const customerId = document.getElementById('pfi-customer').value;
                if (!customerId) return alert('Please select a customer');

                const rows = document.querySelectorAll('#pfi-line-items tr');
                if (rows.length === 0) return alert('At least one item is required');

                const btn = event.target;
                const originalText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = 'Saving...';

                try {
                    const pfiType = document.getElementById('pfi-type')?.value || 'Regular';
                    const proforma = {
                        doc_no: document.getElementById('pfi-no').value,
                        date: document.getElementById('pfi-date').value,
                        customer_id: customerId,
                        validity_date: document.getElementById('pfi-validity').value,
                        type: pfiType,
                        status: isDraft ? 'Draft' : 'Open',
                        currency: document.getElementById('pfi-currency')?.value || 'INR',
                        bank_id: document.getElementById('pfi-bank')?.value || null,
                        terms: document.getElementById('pfi-terms').value,
                        payment_terms: document.getElementById('pfi-payment-terms')?.value || null,
                        delivery_time: document.getElementById('pfi-delivery-time')?.value || null,
                        delivery_mode: document.getElementById('pfi-delivery-mode')?.value || null,
                        total_amount: parseFloat(document.getElementById('pfi-sum-total').textContent.replace(/[^0-9.]/g, '')),
                        bank_charges: parseFloat(document.getElementById('pfi-bank-charges')?.value) || 0,
                        user_id: state.user.id,
                        metadata: {
                            country: document.getElementById('pfi-country')?.value || '',
                            purchase_no: document.getElementById('pfi-purchase-no')?.value || '',
                            purchase_date: document.getElementById('pfi-purchase-date')?.value || '',
                            custom_fields: Array.from(document.querySelectorAll('#pfi-custom-fields > div')).map(div => ({
                                name: div.querySelector('.cf-name').value,
                                value: div.querySelector('.cf-value').value
                            })).filter(f => f.name || f.value)
                        }
                    };

                    let pfiData;
                    if (ui.proforma_v2.activeId) {
                        const { data, error } = await supabaseClient
                            .from('proforma_invoices')
                            .update(proforma)
                            .eq('id', ui.proforma_v2.activeId)
                            .select()
                            .single();
                        if (error) throw error;
                        pfiData = data;
                        await supabaseClient.from('proforma_items').delete().eq('proforma_id', pfiData.id);
                    } else {
                        const { data, error } = await supabaseClient.from('proforma_invoices').insert(proforma).select().single();
                        if (error) throw error;
                        pfiData = data;
                    }

                    const items = [];
                    rows.forEach(row => {
                        const productId = row.querySelector('.product-id-hidden').value;
                        if (!productId) return;
                        items.push({
                            proforma_id: pfiData.id,
                            product_id: productId,
                            hsn_code: row.querySelector('.hsn-input').value,
                            qty: parseFloat(row.querySelector('.qty-input').value),
                            rate: parseFloat(row.querySelector('.rate-input').value),
                            discount: parseFloat(row.querySelector('.discount-input').value),
                            user_id: state.user.id
                        });
                    });

                    const { error: itemError } = await supabaseClient.from('proforma_items').insert(items);
                    if (itemError) throw itemError;

                    ui.modal.close();
                    await api.docs.fetch('proforma');
                    api.notifications.show(`Pro Forma ${isDraft ? 'Draft ' : ''}Saved Successfully`);

                    if (print) {
                        api.docs.generatePDF('proforma', pfiData.id);
                    }
                } catch (err) {
                    console.error('Save Error:', err);
                    alert('Save Failed: ' + err.message);
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }
            },
        },

        quotation_v2: {
            activeId: null,
            activeStatus: null,
            includeSignature: true,

            filterCustomers: (query) => {
                const results = document.getElementById('qtn-customer-results');
                if (!results) return;

                if (!query) {
                    results.classList.add('hidden');
                    return;
                }

                const filtered = state.customers.filter(c =>
                    c.name.toLowerCase().includes(query.toLowerCase()) ||
                    (c.company && c.company.toLowerCase().includes(query.toLowerCase()))
                ).slice(0, 5);

                if (filtered.length > 0) {
                    results.innerHTML = filtered.map(c => `
                        <div class="customer-result-item" onclick="ui.quotation_v2.selectCustomer('${c.id}', '${c.name.replace(/'/g, "\\'")}')">
                            <div class="item-info">
                                <span class="customer-name">${c.name}</span>
                                <span class="customer-meta">${c.company || 'Individual'}</span>
                            </div>
                            <div class="customer-city">
                                ${c.city || 'Local'}
                            </div>
                        </div>
                    `).join('');
                    results.classList.remove('hidden');
                } else {
                    results.innerHTML = '<div class="p-4 text-xs font-bold text-slate-400">No customers found</div>';
                    results.classList.remove('hidden');
                }
            },

            selectCustomer: (id, name) => {
                document.getElementById('qtn-customer').value = id;
                document.getElementById('qtn-customer-search').value = name;
                document.getElementById('qtn-customer-results').classList.add('hidden');
                ui.quotation_v2.updateCalculations();
            },

            addCustomField: (name = '', value = '') => {
                const id = Date.now().toString();
                const container = document.getElementById('qtn-custom-fields');
                if (!container) return;
                const div = document.createElement('div');
                div.className = 'flex gap-3 items-center group animate-slide-up bg-white p-2 rounded-lg border border-slate-100';
                div.id = `qcf-${id}`;
                div.innerHTML = `
                    <input type="text" class="form-input text-sm qcf-name w-1/3 bg-transparent border-none font-bold placeholder:text-slate-300" placeholder="Label" value="${name}">
                    <div class="w-px h-4 bg-slate-200"></div>
                    <input type="text" class="form-input text-sm qcf-value flex-1 bg-transparent border-none font-medium placeholder:text-slate-300" placeholder="Value" value="${value}">
                    <button onclick="ui.quotation_v2.removeCustomField('${id}')" class="text-slate-300 hover:text-red-500 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                `;
                container.appendChild(div);
            },
            removeCustomField: (id) => {
                const row = document.getElementById(`qcf-${id}`);
                if (row) row.remove();
            },

            filterProducts: (rowId, query) => {
                const results = document.getElementById(`results-${rowId}`);
                if (!results) return;

                if (!query) {
                    results.classList.add('hidden');
                    return;
                }

                const filtered = state.products.filter(p =>
                    p.name.toLowerCase().includes(query.toLowerCase()) ||
                    (p.sku && p.sku.toLowerCase().includes(query.toLowerCase()))
                ).slice(0, 5);

                if (filtered.length === 0) {
                    results.innerHTML = `<div class="p-4 text-xs font-bold text-slate-400">No products found</div>`;
                } else {
                    results.innerHTML = filtered.map(p => `
                        <div class="product-result-item" onclick="ui.quotation_v2.selectProduct('${rowId}', '${p.id}', '${p.name.replace(/'/g, "\\'")}')">
                            <div class="item-info">
                                <span class="product-name">${p.name}</span>
                                <span class="product-meta">SKU: ${p.sku || 'No SKU'}</span>
                            </div>
                            <div class="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-900 tabular-nums">
                                ₹${p.price.toLocaleString()}
                            </div>
                        </div>
                    `).join('');
                }
                results.classList.remove('hidden');
            },

            selectProduct: (rowId, productId, productName) => {
                const row = document.getElementById(`qrow-${rowId}`);
                if (row) {
                    row.querySelector('.product-search-input').value = productName;
                    row.querySelector('.product-id-hidden').value = productId;
                    document.getElementById(`results-${rowId}`).classList.add('hidden');
                    ui.quotation_v2.onItemSelect(rowId, productId);
                }
            },

            addItem: () => {
                const id = Date.now().toString();
                const container = document.getElementById('qtn-line-items');
                const emptyState = document.getElementById('qtn-empty-state');
                if (!container) return;

                if (emptyState) emptyState.classList.add('hidden');

                const row = document.createElement('tr');
                row.id = `qrow-${id}`;
                row.innerHTML = `
                    <td class="p-4">
                        <div class="product-search-container">
                            <input type="text"
                                class="form-input text-sm product-search-input w-full bg-transparent border-none font-bold focus:ring-0"
                                placeholder="Search product..."
                                oninput="ui.quotation_v2.filterProducts('${id}', this.value)"
                                autocomplete="off">
                            <input type="hidden" class="product-id-hidden">
                            <div id="results-${id}" class="product-results-list hidden"></div>
                        </div>
                    </td>
                    <td class="p-4">
                        <input type="text" class="form-input text-sm hsn-input w-full bg-slate-50 border-none rounded-lg font-bold" placeholder="HSN/SAC">
                    </td>
                    <td class="p-4">
                        <input type="number" class="form-input text-sm qty-input w-full bg-slate-50 border-none rounded-lg text-center font-bold" value="1" min="1" oninput="ui.quotation_v2.updateCalculations()">
                    </td>
                    <td class="p-4">
                        <input type="number" class="form-input text-sm rate-input w-full bg-transparent border-none font-bold" value="0" min="0" oninput="ui.quotation_v2.updateCalculations()">
                    </td>
                    <td class="p-4">
                        <input type="number" class="form-input text-sm discount-input w-full bg-slate-50 border-none rounded-lg text-center font-bold" value="0" min="0" max="100" oninput="ui.quotation_v2.updateCalculations()">
                    </td>
                    <td class="p-4">
                        <div class="tax-text text-[10px] font-bold text-slate-400">-</div>
                        <div class="text-[10px] font-bold text-slate-900 border-t border-slate-100 mt-1 pt-1 row-total-with-tax">₹0.00</div>
                    </td>
                    <td class="p-4 text-right">
                        <div class="row-total text-sm font-black text-slate-900 tabular-nums">₹0.00</div>
                    </td>
                    <td class="p-4 text-center">
                        <button onclick="ui.quotation_v2.removeItem('${id}')" class="p-2 text-slate-300 hover:text-red-500 transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </td>
                `;
                container.appendChild(row);
                ui.quotation_v2.updateCalculations();
            },

            removeItem: (id) => {
                const row = document.getElementById(`qrow-${id}`);
                if (row) row.remove();

                const container = document.getElementById('qtn-line-items');
                const emptyState = document.getElementById('qtn-empty-state');
                if (container && container.children.length === 0 && emptyState) {
                    emptyState.classList.remove('hidden');
                }

                ui.quotation_v2.updateCalculations();
            },

            onItemSelect: (rowId, productId) => {
                const product = state.products.find(p => p.id === productId);
                const row = document.getElementById(`qrow-${rowId}`);
                if (product && row) {
                    row.querySelector('.rate-input').value = product.price;
                    row.querySelector('.hsn-input').value = product.hsn || '';
                    ui.quotation_v2.updateCalculations();
                }
            },

            toggleExportFields: () => {
                const type = document.getElementById('qtn-type')?.value;
                const exportDiv = document.getElementById('qtn-export-fields');
                const currencyEl = document.getElementById('qtn-currency');
                const bankChargesDiv = document.getElementById('qtn-bank-charges-container');
                const bankChargesInput = document.getElementById('qtn-bank-charges');

                if (type === 'LUT / Export') {
                    if (exportDiv) {
                        exportDiv.classList.remove('hidden');
                        exportDiv.classList.add('block');
                    }
                    if (bankChargesDiv) bankChargesDiv.classList.remove('hidden');
                    if (currencyEl && currencyEl.value === 'INR') {
                        currencyEl.value = 'USD';
                    }
                } else {
                    if (exportDiv) {
                        exportDiv.classList.remove('block');
                        exportDiv.classList.add('hidden');
                    }
                    if (bankChargesDiv) bankChargesDiv.classList.add('hidden');
                    if (bankChargesInput) bankChargesInput.value = 0;
                }
                ui.quotation_v2.updateCalculations();
            },

            updateDocNo: async () => {
                const dateInput = document.getElementById('qtn-date');
                const noInput = document.getElementById('qtn-no');
                if (!dateInput || !noInput || ui.quotation_v2.activeId) return;

                const selectedDate = new Date(dateInput.value);
                const year = selectedDate.getFullYear();
                const month = selectedDate.getMonth();

                let fyStart, fyEnd;
                if (month < 3) {
                    fyStart = year - 1;
                    fyEnd = year;
                } else {
                    fyStart = year;
                    fyEnd = year + 1;
                }

                try {
                    const { data, error } = await supabaseClient
                        .from('quotations')
                        .select('quotation_no')
                        .gte('date', `${fyStart}-04-01`)
                        .lte('date', `${fyEnd}-03-31`)
                        .order('quotation_no', { ascending: false })
                        .limit(1);

                    if (error) throw error;

                    let nextSeq = 1;
                    if (data && data.length > 0 && data[0].quotation_no) {
                        const match = data[0].quotation_no.match(/-(\d+)$/);
                        if (match) {
                            nextSeq = parseInt(match[1]) + 1;
                        }
                    }

                    const newDocNo = `LGS-QTN-${fyStart}-${String(fyEnd).slice(-2)}-${String(nextSeq).padStart(3, '0')}`;
                    noInput.value = newDocNo;
                } catch (err) {
                    console.error('Error generating QTN number:', err);
                    noInput.value = `LGS-QTN-${fyStart}-${String(fyEnd).slice(-2)}-001`;
                }
            },

            loadDefaultTerms: () => {
                document.getElementById('qtn-terms').value = `1. Validity: This quotation is valid for 15 days from the date of issue.\n2. Payment: As per the selected payment terms.\n3. Delivery: Subject to stock availability at the time of order confirmation.\n4. Warranty: Standard manufacturer warranty applies unless otherwise specified.\n5. Taxes: GST as applicable at the time of billing.`;
            },

            toggleSignature: () => {
                ui.quotation_v2.includeSignature = !ui.quotation_v2.includeSignature;
                const label = document.getElementById('qtn-sig-label');
                const toggle = document.getElementById('qtn-sig-toggle');
                if (ui.quotation_v2.includeSignature) {
                    label.textContent = 'Show Signature on Document';
                    toggle.classList.remove('grayscale', 'opacity-50');
                } else {
                    label.textContent = 'Hidden Signature';
                    toggle.classList.add('grayscale', 'opacity-50');
                }
            },

            updateCalculations: () => {
                const customerId = document.getElementById('qtn-customer')?.value;
                const customer = state.customers.find(c => c.id === customerId);
                const qtnType = document.getElementById('qtn-type')?.value;

                const getStateCode = (val, gstinFallback) => {
                    if (val) {
                        const str = String(val);
                        const code = str.includes('-') ? str.split('-')[0].trim() : str.trim();
                        if (code && code.length === 2 && !isNaN(code)) return code;
                    }
                    if (gstinFallback) {
                        const code = String(gstinFallback).substring(0, 2);
                        if (code && code.length === 2 && !isNaN(code)) return code;
                    }
                    return '27';
                };

                const myStateCode = getStateCode(state.settings?.state, state.settings?.gstin);
                const customerStateCode = getStateCode(customer?.state, customer?.gstin);
                const isInterState = customer && customerStateCode !== myStateCode;

                const currency = document.getElementById('qtn-currency')?.value || 'INR';
                const symbol = { 'INR': '₹', 'USD': '$', 'EUR': '€' }[currency];

                let taxableTotal = 0;
                let taxesTotal = 0;
                let totalDiscount = 0;
                let taxBreakdown = {};

                document.querySelectorAll('#qtn-line-items tr').forEach(row => {
                    const productId = row.querySelector('.product-id-hidden').value;
                    const product = state.products.find(p => p.id === productId);
                    const qty = parseFloat(row.querySelector('.qty-input').value) || 0;
                    const rate = parseFloat(row.querySelector('.rate-input').value) || 0;
                    const discPct = parseFloat(row.querySelector('.discount-input').value) || 0;

                    const baseAmount = qty * rate;
                    const discount = (baseAmount * discPct) / 100;
                    const taxable = baseAmount - discount;

                    totalDiscount += discount;
                    taxableTotal += taxable;

                    let gstRate = (product && qtnType === 'Regular') ? (product.gst || 0) : 0;
                    if (qtnType === 'LUT / Export' || qtnType === 'Without GST') gstRate = 0;

                    const taxAmount = Math.round((taxable * gstRate) * 100) / 10000;
                    taxesTotal += taxAmount;

                    if (gstRate > 0) {
                        if (isInterState) {
                            taxBreakdown['IGST'] = Math.round(((taxBreakdown['IGST'] || 0) + taxAmount) * 100) / 100;
                            row.querySelector('.tax-text').textContent = `IGST ${gstRate}%`;
                        } else {
                            const halfTax = taxAmount / 2;
                            taxBreakdown['CGST'] = Math.round(((taxBreakdown['CGST'] || 0) + halfTax) * 100) / 100;
                            taxBreakdown['SGST'] = Math.round(((taxBreakdown['SGST'] || 0) + halfTax) * 100) / 100;
                            row.querySelector('.tax-text').textContent = `CGST/SGST ${gstRate / 2}%`;
                        }
                    } else {
                        row.querySelector('.tax-text').textContent = qtnType === 'Regular' ? '0% GST' : qtnType;
                    }

                    row.querySelector('.row-total').textContent = `${symbol}${taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                    if (row.querySelector('.row-total-with-tax')) {
                        row.querySelector('.row-total-with-tax').textContent = `${symbol}${(taxable + taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                    }
                });

                if (document.getElementById('qtn-sum-discount')) {
                    document.getElementById('qtn-sum-discount').textContent = `Total Discount: ${symbol}${totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                }

                const bankCharges = parseFloat(document.getElementById('qtn-bank-charges')?.value) || 0;
                const roundOffEnabled = document.getElementById('qtn-round-off')?.checked;
                const totalBeforeRound = taxableTotal + taxesTotal + bankCharges;
                let finalTotal = totalBeforeRound;
                let roundOffValue = 0;

                if (roundOffEnabled) {
                    finalTotal = Math.round(totalBeforeRound);
                    roundOffValue = finalTotal - totalBeforeRound;
                }

                document.getElementById('qtn-sum-taxable').textContent = `${symbol}${taxableTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                document.getElementById('qtn-sum-roundoff').textContent = `${symbol}${roundOffValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                document.getElementById('qtn-sum-total').textContent = `${symbol}${finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                if (document.getElementById('qtn-footer-total')) {
                    document.getElementById('qtn-footer-total').textContent = `${symbol}${finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                }

                const taxRowsContent = Object.entries(taxBreakdown).map(([name, val]) => `
                    <div class="flex justify-between items-center text-slate-500 font-bold text-xs">
                        <span>${name}</span>
                        <span>${symbol}${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                `).join('');
                document.getElementById('qtn-tax-rows').innerHTML = taxRowsContent;
            },

            save: async (isDraft = false, print = false) => {
                const customerId = document.getElementById('qtn-customer').value;
                if (!customerId) return alert('Please select a customer');

                const rows = document.querySelectorAll('#qtn-line-items tr');
                if (rows.length === 0) return alert('At least one item is required');

                const btn = event.target;
                const originalText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = 'Saving...';

                try {
                    const qtnType = document.getElementById('qtn-type')?.value || 'Regular';
                    const quotation = {
                        quotation_no: document.getElementById('qtn-no').value,
                        date: document.getElementById('qtn-date').value,
                        customer_id: customerId,
                        validity_date: document.getElementById('qtn-validity').value,
                        subject: document.getElementById('qtn-subject').value,
                        type: qtnType,
                        status: isDraft ? 'Draft' : 'Open',
                        currency: document.getElementById('qtn-currency')?.value || 'INR',
                        bank_id: document.getElementById('qtn-bank')?.value || null,
                        payment_terms: document.getElementById('qtn-payment-terms').value,
                        delivery_time: document.getElementById('qtn-delivery-time').value,
                        delivery_mode: document.getElementById('qtn-delivery-mode').value,
                        terms: document.getElementById('qtn-terms').value,
                        total_amount: parseFloat(document.getElementById('qtn-sum-total').textContent.replace(/[^0-9.]/g, '')),
                        bank_charges: parseFloat(document.getElementById('qtn-bank-charges')?.value) || 0,
                        user_id: state.user.id,
                        metadata: {
                            country: document.getElementById('qtn-country')?.value || '',
                            include_signature: ui.quotation_v2.includeSignature,
                            round_off: document.getElementById('qtn-round-off')?.checked,
                            custom_fields: Array.from(document.querySelectorAll('#qtn-custom-fields > div')).map(div => ({
                                name: div.querySelector('.qcf-name').value,
                                value: div.querySelector('.qcf-value').value
                            })).filter(f => f.name || f.value)
                        }
                    };

                    let qtnData;
                    const isExistingDraft = ui.quotation_v2.activeId && ui.quotation_v2.activeStatus === 'Draft';

                    if (isExistingDraft) {
                        const { data, error } = await supabaseClient
                            .from('quotations')
                            .update(quotation)
                            .eq('id', ui.quotation_v2.activeId)
                            .select()
                            .single();
                        if (error) throw error;
                        qtnData = data;
                        await supabaseClient.from('quotation_items').delete().eq('quotation_id', qtnData.id);
                    } else if (ui.quotation_v2.activeId) {
                        // Create Revision logic
                        const baseNo = quotation.quotation_no;
                        const { data: existingDocs } = await supabaseClient
                            .from('quotations')
                            .select('quotation_no')
                            .ilike('quotation_no', `${baseNo}%`)
                            .order('quotation_no', { ascending: false })
                            .limit(1);

                        if (existingDocs && existingDocs.length > 0) {
                            const lastNo = existingDocs[0].quotation_no;
                            let nextRev = 1;
                            const revMatch = lastNo.match(/-R(\d+)$/);
                            if (revMatch) {
                                nextRev = parseInt(revMatch[1]) + 1;
                            }
                            quotation.quotation_no = `${baseNo.split('-R')[0]}-R${nextRev}`;
                        } else {
                            quotation.quotation_no = `${baseNo}-R1`;
                        }

                        const { data, error } = await supabaseClient.from('quotations').insert(quotation).select().single();
                        if (error) throw error;
                        qtnData = data;
                    } else {
                        const { data, error } = await supabaseClient.from('quotations').insert(quotation).select().single();
                        if (error) throw error;
                        qtnData = data;
                    }

                    const items = [];
                    rows.forEach(row => {
                        const productId = row.querySelector('.product-id-hidden').value;
                        if (!productId) return;
                        items.push({
                            quotation_id: qtnData.id,
                            product_id: productId,
                            hsn_code: row.querySelector('.hsn-input').value,
                            qty: parseFloat(row.querySelector('.qty-input').value),
                            rate: parseFloat(row.querySelector('.rate-input').value),
                            discount: parseFloat(row.querySelector('.discount-input').value),
                            user_id: state.user.id
                        });
                    });

                    const { error: itemError } = await supabaseClient.from('quotation_items').insert(items);
                    if (itemError) throw itemError;

                    ui.modal.close();
                    await api.docs.fetch('quotations');
                    api.notifications.show(`Quotation ${isDraft ? 'Draft ' : (isExistingDraft ? 'Finalized ' : '')}Saved Successfully`);

                    if (print) {
                        api.docs.generatePDF('quotations', qtnData.id, ui.quotation_v2.includeSignature);
                    }
                } catch (err) {
                    console.error('Save Error:', err);
                    alert('Save Failed: ' + err.message);
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }
            },
        },


        sales: {
            filter: 'All',
            searchQuery: '',
            setFilter: (f) => {
                ui.sales.filter = f;
                render();
            },
            search: (q) => {
                ui.sales.searchQuery = q;
                render();
                // Restore focus
                const input = document.querySelector('.search-input');
                if (input) {
                    input.focus();
                    input.setSelectionRange(input.value.length, input.value.length);
                }
            }
        },
        products: {
            filter: 'Items',
            searchQuery: '',
            setFilter: (f) => {
                ui.products.filter = f;
                render();
            },
            search: (q) => {
                ui.products.searchQuery = q;
                render();
                // Restore focus
                const input = document.querySelector('.search-input');
                if (input) {
                    input.focus();
                    input.setSelectionRange(input.value.length, input.value.length);
                }
            }
        },
        customers: {
            filter: 'All Customers',
            searchQuery: '',
            setFilter: (f) => {
                ui.customers.filter = f;
                render();
            },
            search: (q) => {
                ui.customers.searchQuery = q;
                render();
                // Restore focus
                const input = document.querySelector('.search-input');
                if (input) {
                    input.focus();
                    input.setSelectionRange(input.value.length, input.value.length);
                }
            }
        },
        purchases: {
            filter: 'All',
            setFilter: (f) => {
                ui.purchases.filter = f;
                render();
            }
        },
        quotations: {
            filter: 'All',
            searchQuery: '',
            setFilter: (f) => {
                ui.quotations.filter = f;
                render();
            },
            search: (q) => {
                ui.quotations.searchQuery = q;
                render();
                // Restore focus
                const input = document.querySelector('.search-input');
                if (input) {
                    input.focus();
                    input.setSelectionRange(input.value.length, input.value.length);
                }
            },
            edit: async (id) => {
                try {
                    const { data: q, error } = await supabaseClient
                        .from('quotations')
                        .select('*, quotation_items(*)')
                        .eq('id', id)
                        .single();

                    if (error) throw error;

                    ui.quotation_v2.activeId = q.id;
                    ui.quotation_v2.activeStatus = q.status;

                    ui.modal.open('quotation-new');

                    // Header fields
                    document.getElementById('qtn-no').value = q.quotation_no;
                    document.getElementById('qtn-date').value = new Date(q.date).toISOString().split('T')[0];
                    document.getElementById('qtn-validity').value = q.validity_date ? new Date(q.validity_date).toISOString().split('T')[0] : '';
                    document.getElementById('qtn-type').value = q.type || 'Regular';

                    // Customer search
                    if (q.customer_id) {
                        const customer = state.customers.find(c => c.id === q.customer_id);
                        ui.quotation_v2.selectCustomer(q.customer_id, customer?.name || 'Unknown Customer');
                    }

                    // Metadata
                    document.getElementById('qtn-subject').value = q.subject || '';
                    document.getElementById('qtn-currency').value = q.currency || 'INR';
                    document.getElementById('qtn-bank').value = q.bank_id || '';
                    document.getElementById('qtn-payment-terms').value = q.payment_terms || '';
                    document.getElementById('qtn-delivery-time').value = q.delivery_time || '';
                    document.getElementById('qtn-delivery-mode').value = q.delivery_mode || '';
                    document.getElementById('qtn-terms').value = q.terms || '';
                    if (document.getElementById('qtn-bank-charges')) document.getElementById('qtn-bank-charges').value = q.bank_charges || 0;

                    if (q.metadata) {
                        if (q.metadata.country) document.getElementById('qtn-country').value = q.metadata.country;
                        if (q.metadata.round_off !== undefined) document.getElementById('qtn-round-off').checked = q.metadata.round_off;
                        if (q.metadata.include_signature !== undefined) {
                            ui.quotation_v2.includeSignature = q.metadata.include_signature;
                            // Update toggle UI
                            const label = document.getElementById('qtn-sig-label');
                            const toggle = document.getElementById('qtn-sig-toggle');
                            if (ui.quotation_v2.includeSignature) {
                                label.textContent = 'Show Signature on Document';
                                toggle.classList.remove('grayscale', 'opacity-50');
                            } else {
                                label.textContent = 'Hidden Signature';
                                toggle.classList.add('grayscale', 'opacity-50');
                            }
                        }
                        if (q.metadata.custom_fields) {
                            q.metadata.custom_fields.forEach(f => ui.quotation_v2.addCustomField(f.name, f.value));
                        }
                    }

                    ui.quotation_v2.toggleExportFields();

                    // Line items
                    const container = document.getElementById('qtn-line-items');
                    container.innerHTML = '';
                    if (q.quotation_items && q.quotation_items.length > 0) {
                        for (const item of q.quotation_items) {
                            ui.quotation_v2.addItem();
                            const lastRow = container.lastElementChild;
                            const product = state.products.find(p => p.id === item.product_id);
                            lastRow.querySelector('.product-search-input').value = product?.name || 'Unknown Product';
                            lastRow.querySelector('.product-id-hidden').value = item.product_id;
                            lastRow.querySelector('.hsn-input').value = item.hsn_code || '';
                            lastRow.querySelector('.qty-input').value = item.qty;
                            lastRow.querySelector('.rate-input').value = item.rate;
                            lastRow.querySelector('.discount-input').value = item.discount || 0;
                        }
                    }
                    ui.quotation_v2.updateCalculations();
                } catch (err) {
                    console.error('Edit Error:', err);
                    alert('Edit Failed: ' + err.message);
                }
            }
        },
        proforma: {
            filter: 'All',
            searchQuery: '',
            setFilter: (f) => {
                ui.proforma.filter = f;
                render();
            },
            search: (q) => {
                ui.proforma.searchQuery = q;
                render();
                // Restore focus
                const input = document.querySelector('.search-input');
                if (input) {
                    input.focus();
                    input.setSelectionRange(input.value.length, input.value.length);
                }
            },
            edit: async (id) => {
                try {
                    const { data: p, error } = await supabaseClient
                        .from('proforma_invoices')
                        .select('*, proforma_items(*)')
                        .eq('id', id)
                        .single();

                    if (error) throw error;

                    ui.proforma_v2.activeId = p.id;
                    ui.proforma_v2.activeStatus = p.status;

                    ui.modal.open('proforma-new');

                    // Populate fields
                    if (document.getElementById('pfi-no')) document.getElementById('pfi-no').value = p.doc_no || '';
                    if (document.getElementById('pfi-date')) document.getElementById('pfi-date').value = p.date || new Date().toISOString().split('T')[0];
                    if (document.getElementById('pfi-validity')) document.getElementById('pfi-validity').value = p.validity_date ? new Date(p.validity_date).toISOString().split('T')[0] : '';
                    if (document.getElementById('pfi-customer')) {
                        document.getElementById('pfi-customer').value = p.customer_id || '';
                        const cust = state.customers.find(c => c.id === p.customer_id);
                        if (cust) document.getElementById('pfi-customer-search').value = cust.name;
                    }
                    if (document.getElementById('pfi-purchase-no')) document.getElementById('pfi-purchase-no').value = p.purchase_no || '';
                    if (document.getElementById('pfi-purchase-date')) document.getElementById('pfi-purchase-date').value = p.purchase_date || '';

                    // Populate custom fields
                    const cfContainer = document.getElementById('pfi-custom-fields');
                    if (cfContainer) {
                        cfContainer.innerHTML = '';
                        if (p.metadata?.custom_fields && Array.isArray(p.metadata.custom_fields)) {
                            p.metadata.custom_fields.forEach(cf => {
                                ui.proforma_v2.addCustomField(cf.name, cf.value);
                            });
                        }
                    }

                    if (document.getElementById('pfi-payment-terms')) document.getElementById('pfi-payment-terms').value = p.payment_terms || '';
                    if (document.getElementById('pfi-delivery-time')) document.getElementById('pfi-delivery-time').value = p.delivery_time || '';
                    if (document.getElementById('pfi-delivery-mode')) document.getElementById('pfi-delivery-mode').value = p.delivery_mode || '';
                    if (document.getElementById('pfi-terms')) document.getElementById('pfi-terms').value = p.terms || '';
                    if (document.getElementById('pfi-currency')) document.getElementById('pfi-currency').value = p.currency || 'INR';
                    if (p.bank_id && document.getElementById('pfi-bank')) document.getElementById('pfi-bank').value = p.bank_id;

                    const typeSelect = document.getElementById('pfi-type');
                    if (typeSelect) {
                        typeSelect.value = p.type || 'Regular';
                    }
                    if (document.getElementById('pfi-bank-charges')) document.getElementById('pfi-bank-charges').value = p.bank_charges || 0;
                    ui.proforma_v2.toggleExportFields();

                    if (p.type === 'LUT / Export' && document.getElementById('pfi-country')) {
                        document.getElementById('pfi-country').value = p.metadata?.country || '';
                    }

                    // Populate line items
                    const container = document.getElementById('pfi-line-items');
                    if (container) {
                        container.innerHTML = '';
                        if (p.proforma_items && p.proforma_items.length > 0) {
                            for (const item of p.proforma_items) {
                                ui.proforma_v2.addItem();
                                const lastRow = container.lastElementChild;
                                if (lastRow) {
                                    const prodSelectInput = lastRow.querySelector('.product-search-input');
                                    const prodIdInput = lastRow.querySelector('.product-id-hidden');
                                    prodIdInput.value = item.product_id;
                                    const product = state.products.find(pr => pr.id === item.product_id);
                                    if (product) prodSelectInput.value = product.name;

                                    lastRow.querySelector('.hsn-input').value = item.hsn_code || '';
                                    lastRow.querySelector('.qty-input').value = item.qty || 1;
                                    lastRow.querySelector('.rate-input').value = item.rate || 0;
                                    lastRow.querySelector('.discount-input').value = item.discount || 0;
                                }
                            }
                            ui.proforma_v2.updateCalculations();
                        }
                    }
                } catch (err) {
                    console.error('Edit Error:', err);
                    alert('Failed to load Pro Forma: ' + err.message);
                }
            }
        },

        challans: {
            filter: 'All',
            setFilter: (f) => {
                ui.challans.filter = f;
                render();
            }
        }
    };

    // --- Data API ---
    const api = {
        notifications: {
            show: (msg, type = 'success') => {
                const div = document.createElement('div');
                div.className = `fixed bottom-4 right-4 px-6 py-3 rounded-xl shadow-lg font-bold text-white transform transition-all translate-y-10 opacity-0 z-50 ${type === 'success' ? 'bg-slate-900' : 'bg-red-500'}`;
                div.textContent = msg;
                document.body.appendChild(div);
                requestAnimationFrame(() => div.classList.remove('translate-y-10', 'opacity-0'));
                setTimeout(() => {
                    div.classList.add('translate-y-10', 'opacity-0');
                    setTimeout(() => div.remove(), 300);
                }, 3000);
            }
        },
        masters: {
            fetch: async () => {
                console.log('📦 Refreshing Master Data...');
                const { data: products } = await supabaseClient.from('products').select('*');
                state.products = products || [];

                const { data: customers } = await supabaseClient.from('customers').select('*');
                state.customers = customers || [];

                // Fetch Settings (Single Row)
                const { data: settings } = await supabaseClient.from('settings').select('*').limit(1);
                state.settings = settings && settings.length > 0 ? settings[0] : {};

                render();
            },

            save: async (table, e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());

                // Cleanup empty IDs
                if (!data.id) delete data.id;

                // Add Meta
                data.user_id = state.user.id;

                try {
                    const { error } = await supabaseClient.from(table).upsert(data);
                    if (error) throw error;
                    ui.modal.close();
                    await api.masters.fetch();
                } catch (err) {
                    console.error('Save Error:', err);
                    alert('Save Failed: ' + err.message);
                }
            },
            delete: async (table, id) => {
                if (!confirm('Permanent Action: Are you sure you want to delete this master entry?')) return;
                try {
                    const { error } = await supabaseClient.from(table).delete().eq('id', id);
                    if (error) throw error;
                    await api.masters.fetch();
                } catch (err) {
                    console.error('Delete Error:', err);
                    alert('Delete Failed: ' + err.message);
                }
            }
        },
        settings: {
            save: async (e) => {
                e.preventDefault();
                const btn = e.target.querySelector('button[type="submit"]');
                const originalText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = 'Saving...';

                try {
                    const formData = new FormData(e.target);
                    // Base object
                    const updates = {
                        company_name: formData.get('company_name'),
                        company_email: formData.get('company_email'),
                        company_phone: formData.get('company_phone'),
                        website: formData.get('website'),
                        gstin: formData.get('gstin'),
                        state: formData.get('state'),
                        pan_no: formData.get('pan_no'),
                        msme_no: formData.get('msme_no'),
                        address: formData.get('address'),
                        bank_inr_name: formData.get('bank_inr_name'),
                        bank_inr_acc_no: formData.get('bank_inr_acc_no'),
                        bank_inr_branch: formData.get('bank_inr_branch'),
                        bank_inr_ifsc: formData.get('bank_inr_ifsc'),
                        bank_inr_swift: formData.get('bank_inr_swift'),
                        bank_usd_name: formData.get('bank_usd_name'),
                        bank_usd_acc_no: formData.get('bank_usd_acc_no'),
                        bank_usd_branch: formData.get('bank_usd_branch'),
                        bank_usd_ifsc: formData.get('bank_usd_ifsc'),
                        bank_usd_swift: formData.get('bank_usd_swift'),
                        updated_at: new Date()
                    };

                    // Handle File Inputs (Convert to Base64)
                    const fileFields = ['company_logo', 'signature', 'stamp'];
                    for (const field of fileFields) {
                        const file = formData.get(field);
                        if (file && file.size > 0) {
                            updates[field] = await new Promise((resolve, reject) => {
                                const reader = new FileReader();
                                reader.onload = () => resolve(reader.result);
                                reader.onerror = reject;
                                reader.readAsDataURL(file);
                            });
                        }
                    }

                    // Check if we updating or inserting
                    if (state.settings && state.settings.id) {
                        updates.id = state.settings.id;
                    }

                    const { data, error } = await supabaseClient.from('settings').upsert(updates).select();

                    if (error) throw error;

                    state.settings = data[0]; // Update local state
                    api.notifications.show('Settings saved successfully');
                    render(); // Refresh to show new images/data
                } catch (err) {
                    console.error('Settings Save Error:', err);
                    alert('Failed to save settings: ' + err.message);
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }
            }
        },
        invoices: {
            fetch: async () => {
                try {
                    const { data, error } = await supabaseClient
                        .from('invoices')
                        .select('*, customers(name, billing_city, contact_phone, state, gstin)')
                        .order('created_at', { ascending: false });

                    if (error) throw error;

                    const mappedData = (data || []).map(item => ({
                        ...item,
                        customers: item.customers ? {
                            ...item.customers,
                            city: item.customers.billing_city,
                            phone: item.customers.contact_phone,
                            state: item.customers.state,
                            gstin: item.customers.gstin
                        } : null
                    }));

                    state.invoices = mappedData;
                    render();
                } catch (err) {
                    console.error('Fetch Invoices Error:', err);
                    api.notifications.show('Failed to fetch invoices: ' + err.message, 'error');
                }
            },
            save: async (isDraft = false, isPrint = false) => {
                const btn = event.target;
                const originalText = btn.textContent;
                btn.disabled = true;
                btn.textContent = 'Saving...';

                try {
                    const customFields = [];
                    document.querySelectorAll('.inv-cf-name').forEach((el, i) => {
                        const name = el.value.trim();
                        const val = document.querySelectorAll('.inv-cf-value')[i].value.trim();
                        if (name) customFields.push({ name, value: val });
                    });

                    const invoice = {
                        invoice_no: document.getElementById('inv-no').value,
                        date: document.getElementById('inv-date').value,
                        due_date: document.getElementById('inv-due-date')?.value || null,
                        customer_id: document.getElementById('inv-customer').value,
                        type: document.getElementById('inv-type').value,
                        currency: document.getElementById('inv-currency')?.value || 'INR',
                        exchange_rate: parseFloat(document.getElementById('inv-exchange-rate')?.value) || 1.0,
                        bank_id: document.getElementById('inv-bank').value,
                        purchase_no: document.getElementById('inv-purchase-no').value,
                        purchase_date: document.getElementById('inv-purchase-date').value || null,
                        payment_terms: document.getElementById('inv-payment-terms').value,
                        delivery_time: document.getElementById('inv-delivery-time').value,
                        delivery_mode: document.getElementById('inv-delivery-mode').value,
                        notes: document.getElementById('inv-notes').value,
                        custom_fields: customFields,
                        subtotal: parseFloat(document.getElementById('inv-sum-taxable').textContent.replace(/[^0-9.-]/g, '')),
                        total_amount: parseFloat(document.getElementById('inv-sum-total').textContent.replace(/[^0-9.-]/g, '')),
                        user_id: state.user.id,
                        bank_charges: parseFloat(document.getElementById('inv-bank-charges')?.value) || 0,
                        status: isDraft ? 'Draft' : 'Pending',
                        metadata: {
                            converted_from_pfi: ui.invoice.sourcePfiId || null,
                            conversion_date: ui.invoice.sourcePfiId ? new Date().toISOString() : null
                        }
                    };

                    if (!invoice.customer_id) throw new Error('Please select a customer');

                    let invData, invError;
                    if (ui.invoice.activeId) {
                        const { data, error } = await supabaseClient
                            .from('invoices')
                            .update(invoice)
                            .eq('id', ui.invoice.activeId)
                            .select()
                            .single();
                        invData = data; invError = error;
                    } else {
                        const { data, error } = await supabaseClient
                            .from('invoices')
                            .insert(invoice)
                            .select()
                            .single();
                        invData = data; invError = error;
                    }

                    if (invError) throw invError;

                    // Save/Update Line Items (Simplified: delete and re-insert)
                    if (ui.invoice.activeId) {
                        await supabaseClient.from('invoice_items').delete().eq('invoice_id', ui.invoice.activeId);
                    }

                    const lineItems = [];
                    document.querySelectorAll('#inv-line-items tr').forEach(row => {
                        const productId = row.querySelector('.item-product-id').value;
                        if (!productId) return;

                        lineItems.push({
                            invoice_id: invData.id,
                            product_id: productId,
                            qty: parseFloat(row.querySelector('.item-qty').value) || 0,
                            rate: parseFloat(row.querySelector('.item-rate').value) || 0,
                            discount: parseFloat(row.querySelector('.item-discount').value) || 0,
                            hsn_code: row.querySelector('.item-hsn').value,
                            user_id: state.user.id
                        });
                    });

                    const { error: itemError } = await supabaseClient.from('invoice_items').insert(lineItems);
                    if (itemError) throw itemError;

                    // If converted from PFI, mark PFI as closed
                    if (ui.invoice.sourcePfiId) {
                        await supabaseClient.from('proforma_invoices')
                            .update({ status: 'Closed', metadata: { converted_to_invoice: invData.id } })
                            .eq('id', ui.invoice.sourcePfiId);
                    }

                    ui.modal.close();
                    ui.invoice.activeId = null;
                    ui.invoice.sourcePfiId = null;
                    await api.invoices.fetch();
                    api.notifications.show(isDraft ? 'Draft saved successfully!' : 'Invoice saved successfully!', 'success');

                    if (isPrint) {
                        await api.docs.generatePDF('invoices', invData.id);
                    }
                } catch (err) {
                    console.error('Invoice Save Error:', err);
                    alert('Error: ' + err.message);
                } finally {
                    btn.disabled = false;
                    btn.textContent = originalText;
                }
            },
            delete: async (id) => {
                if (!confirm('Permanent Action: Delete this invoice?')) return;
                try {
                    const { error } = await supabaseClient.from('invoices').delete().eq('id', id);
                    if (error) throw error;
                    await api.invoices.fetch();
                } catch (err) {
                    alert('Delete Failed: ' + err.message);
                }
            },
            togglePayment: async (id, newStatus) => {
                try {
                    const { error } = await supabaseClient
                        .from('invoices')
                        .update({ status: newStatus })
                        .eq('id', id);

                    if (error) throw error;

                    await api.invoices.fetch();
                    api.notifications.show(`Invoice marked as ${newStatus}!`, 'success');
                } catch (err) {
                    console.error('Toggle Payment Error:', err);
                    api.notifications.show('Failed to update status: ' + err.message, 'error');
                }
            }
        },
        licenses: {
            fetch: async () => {
                try {
                    const { data, error } = await supabaseClient
                        .from('licenses')
                        .select('*, customers(name, billing_city)')
                        .order('end_date', { ascending: true });

                    if (error) throw error;
                    state.licenses = data || [];
                    render();
                } catch (err) {
                    console.error('Fetch Licenses Error:', err);
                    api.notifications.show('Failed to fetch licenses', 'error');
                }
            },
            save: async (e) => {
                e.preventDefault();
                const btn = e.target.querySelector('button[type="submit"]');
                const originalText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = 'Saving...';

                try {
                    const formData = new FormData(e.target);
                    const data = Object.fromEntries(
                        Array.from(formData.entries()).filter(([_, v]) => v !== "")
                    );

                    data.user_id = state.user.id;

                    // Calculate status before saving
                    const ed = new Date(data.end_date);
                    const now = new Date();
                    const diffDays = Math.ceil((ed - now) / (1000 * 60 * 60 * 24));
                    data.status = diffDays < 0 ? 'Expired' : (diffDays <= 30 ? 'Expiring Soon' : 'Active');

                    const { error } = await supabaseClient.from('licenses').upsert(data);
                    if (error) throw error;

                    ui.modal.close();
                    await api.licenses.fetch();
                    api.notifications.show('License Saved Successfully');
                } catch (err) {
                    console.error('License Save Error:', err);
                    alert('Save Failed: ' + err.message);
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }
            },
            delete: async (id) => {
                if (!confirm('Are you sure you want to delete this license?')) return;
                try {
                    const { error } = await supabaseClient.from('licenses').delete().eq('id', id);
                    if (error) throw error;
                    await api.licenses.fetch();
                    api.notifications.show('License Deleted');
                } catch (err) {
                    console.error('Delete License Error:', err);
                    alert('Delete Failed: ' + err.message);
                }
            }
        },
        pdf: {
            generate: async (id) => {
                try {
                    console.log('📄 Generating PDF for:', id);
                    const { data: inv, error: invErr } = await supabaseClient
                        .from('invoices')
                        .select('*, customers(*)')
                        .eq('id', id)
                        .single();
                    if (invErr) throw invErr;

                    const { data: items, error: itemErr } = await supabaseClient
                        .from('invoice_items')
                        .select('*, products(*)')
                        .eq('invoice_id', id);
                    if (itemErr) throw itemErr;

                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF();

                    // Header
                    doc.setFontSize(22);
                    doc.setTextColor(15, 23, 42); // slate-900
                    doc.text('TAX INVOICE', 105, 20, { align: 'center' });

                    doc.setFontSize(10);
                    doc.setTextColor(100);
                    doc.text('LaGa Business Suite - Enterprise Edition', 105, 26, { align: 'center' });

                    // Business Info (Left)
                    doc.setFontSize(12);
                    doc.setTextColor(15, 23, 42);
                    doc.text('FROM:', 20, 40);
                    doc.setFontSize(10);
                    doc.text('LaGa Systems Pvt Ltd', 20, 46);
                    doc.text('GSTIN: 27ABCDE1234F1Z5', 20, 51); // Mock company GST
                    doc.text('Mumbai, Maharashtra', 20, 56);

                    // Client Info (Right)
                    doc.setFontSize(12);
                    doc.text('BILL TO:', 120, 40);
                    doc.setFontSize(10);
                    doc.text(inv.customers?.name || 'Cash Sale', 120, 46);
                    doc.text(`GSTIN: ${inv.customers?.gstin || 'Unregistered'}`, 120, 51);
                    doc.text(`${inv.customers?.city || ''}, ${inv.customers?.state || ''}`, 120, 56);

                    // Invoice Details
                    doc.text(`Invoice No: ${inv.invoice_no}`, 20, 75);
                    doc.text(`Date: ${new Date(inv.date).toLocaleDateString()}`, 120, 75);

                    // Table
                    const tableData = items.map((item, idx) => [
                        idx + 1,
                        item.products?.name || 'Custom Item',
                        item.products?.hsn || '-',
                        item.qty,
                        `₹${item.rate.toLocaleString()}`,
                        `₹${(item.qty * item.rate).toLocaleString()}`
                    ]);

                    doc.autoTable({
                        startY: 85,
                        head: [['#', 'Description', 'HSN/SAC', 'Qty', 'Rate', 'Amount']],
                        body: tableData,
                        theme: 'grid',
                        headStyles: { fillColor: [15, 23, 42], textColor: 255 },
                        styles: { fontSize: 8 }
                    });

                    // Totals
                    const finalY = doc.lastAutoTable.finalY + 10;
                    doc.setFontSize(10);
                    doc.text(`Subtotal: ₹${inv.subtotal.toLocaleString()}`, 140, finalY);
                    doc.text(`GST Amount: ₹${(inv.total_amount - inv.subtotal).toLocaleString()}`, 140, finalY + 7);

                    doc.setFontSize(12);
                    doc.setFont(undefined, 'bold');
                    doc.text(`Total Payable: ₹${inv.total_amount.toLocaleString()}`, 140, finalY + 16);

                    doc.save(`${inv.invoice_no}.pdf`);
                } catch (err) {
                    console.error('PDF Error:', err);
                    alert('PDF Generation failed: ' + err.message);
                }
            }
        },
        purchases: {
            fetch: async () => {
                try {
                    const { data, error } = await supabaseClient
                        .from('purchases')
                        .select('*, customers(name, billing_city, contact_phone)')
                        .order('created_at', { ascending: false });

                    if (error) throw error;

                    const mappedData = (data || []).map(item => ({
                        ...item,
                        customers: item.customers ? {
                            ...item.customers,
                            city: item.customers.billing_city,
                            phone: item.customers.contact_phone
                        } : null
                    }));

                    state.purchases = mappedData;
                    render();
                } catch (err) {
                    console.error('Fetch Purchases Error:', err);
                    api.notifications.show('Failed to fetch purchases: ' + err.message, 'error');
                }
            },
            save: async () => {
                const btn = event.target;
                btn.disabled = true;
                btn.textContent = 'Recording...';

                try {
                    const purchase = {
                        vendor_invoice_no: document.getElementById('pur-no').value,
                        date: document.getElementById('pur-date').value,
                        vendor_id: document.getElementById('pur-vendor').value,
                        subtotal: parseFloat(document.getElementById('pur-subtotal').textContent.replace(/[₹,]/g, '')),
                        tax_amount: parseFloat(document.getElementById('pur-tax').textContent.replace(/[₹,]/g, '')),
                        total_amount: parseFloat(document.getElementById('pur-total').textContent.replace(/[₹,]/g, '')),
                        user_id: state.user.id
                    };

                    if (!purchase.vendor_id || !purchase.vendor_invoice_no) throw new Error('Vendor and Bill No. are required');

                    const { data: purData, error: purError } = await supabaseClient
                        .from('purchases')
                        .insert(purchase)
                        .select()
                        .single();

                    if (purError) throw purError;

                    // Save Items
                    const lineItems = [];
                    document.querySelectorAll('.pur-item-select').forEach(select => {
                        const row = select.closest('.line-item-row');
                        lineItems.push({
                            purchase_id: purData.id,
                            product_id: select.value,
                            qty: parseFloat(row.querySelector('.pur-item-qty').value),
                            rate: parseFloat(row.querySelector('.pur-item-rate').value),
                            user_id: state.user.id
                        });
                    });

                    const { error: itemError } = await supabaseClient.from('purchase_items').insert(lineItems);
                    if (itemError) throw itemError;

                    ui.modal.close();
                    await api.purchases.fetch();
                    await api.reports.fetchStats();
                    alert('Purchase Recorded Successfully!');
                } catch (err) {
                    alert('Error: ' + err.message);
                } finally {
                    btn.disabled = false;
                    btn.textContent = 'Complete Purchase';
                }
            },
            delete: async (id) => {
                if (!confirm('Permanent Action: Delete this purchase record?')) return;
                try {
                    const { error } = await supabaseClient.from('purchases').delete().eq('id', id);
                    if (error) throw error;
                    await api.purchases.fetch();
                    await api.reports.fetchStats();
                } catch (err) {
                    alert('Delete Failed: ' + err.message);
                }
            }
        },
        reports: {
            fetchStats: async () => {
                const results = {
                    sales: { taxable: 0, tax: 0, b2b: 0, b2cl: 0, b2cs: 0, exp: 0 },
                    purchases: { taxable: 0, tax: 0 },
                    hsn: {} // table 12
                };

                const getCompanyStateCode = () => {
                    const s = state.settings?.state || '';
                    if (s && s.length >= 2 && /^\d/.test(s)) return s.substring(0, 2);
                    const g = state.settings?.gstin || '';
                    if (g && g.length >= 2 && /^\d/.test(g)) return g.substring(0, 2);
                    return '';
                };
                const myStateCode = getCompanyStateCode();

                // Create a map for IDs to easily fetch items later if needed, 
                // but let's fetch ALL items for these invoices for HSN summary
                const invIds = state.invoices.map(i => i.id);
                const { data: allItems } = await supabaseClient
                    .from('invoice_items')
                    .select('*, products(name)')
                    .in('invoice_id', invIds);

                state.invoices.forEach(inv => {
                    const exRate = inv.exchange_rate || 1.0;
                    const taxable = inv.subtotal * exRate;
                    const tax = (inv.total_amount - inv.subtotal) * exRate;
                    const totalINR = inv.total_amount * exRate;

                    results.sales.taxable += taxable;
                    results.sales.tax += tax;

                    if (inv.type === 'LUT / Export') {
                        results.sales.exp += taxable;
                    } else if (inv.type === 'Regular') {
                        results.sales.b2b += taxable;
                    } else {
                        // B2C Logic: Large if total > 2.5L AND Interstate
                        // For interstate, check if customer state != my state
                        // Note: billing_state is more reliable if available
                        const custState = String(inv.customers?.state || '');
                        const custStateCode = custState.substring(0, 2);
                        const isInterstate = myStateCode && custStateCode && myStateCode !== custStateCode;

                        if (isInterstate && totalINR > 250000) {
                            results.sales.b2cl += taxable;
                        } else {
                            results.sales.b2cs += taxable;
                        }
                    }
                });

                // HSN Aggregation
                if (allItems) {
                    allItems.forEach(item => {
                        const inv = state.invoices.find(i => i.id === item.invoice_id);
                        if (!inv) return;

                        const exRate = inv.exchange_rate || 1.0;
                        const hsn = item.hsn_code || 'N/A';
                        if (!results.hsn[hsn]) {
                            results.hsn[hsn] = {
                                code: hsn,
                                desc: item.products?.name || 'Item',
                                taxable: 0,
                                tax: 0
                            };
                        }
                        const rowTaxable = (item.qty * item.rate * (1 - (item.discount || 0) / 100)) * exRate;
                        // Tax calculation per item is safer for HSN summary
                        // Assuming GST rate is per product. Let's find product GST
                        const prodMain = state.products.find(p => p.id === item.product_id);
                        const gstRate = (inv.type === 'Regular') ? (prodMain?.gst || 0) : 0;
                        const rowTax = (rowTaxable * gstRate) / 100;

                        results.hsn[hsn].taxable += rowTaxable;
                        results.hsn[hsn].tax += rowTax;
                    });
                }

                results.purchases.tax = state.purchases.reduce((sum, pur) => sum + (pur.tax_amount || 0), 0);
                results.purchases.taxable = state.purchases.reduce((sum, pur) => sum + (pur.subtotal || 0), 0);

                state.reports = results;
                render();
            }
        },
        proforma: {
            togglePaymentStatus: async (id, status) => {
                try {
                    const { data: p, error: fetchError } = await supabaseClient
                        .from('proforma_invoices')
                        .select('metadata')
                        .eq('id', id)
                        .single();

                    if (fetchError) throw fetchError;

                    const newMetadata = { ...p.metadata, payment_status: status };
                    const updates = { metadata: newMetadata };

                    // Sync Document Status
                    if (status === 'Paid') updates.status = 'Closed';
                    else if (status === 'Unpaid') updates.status = 'open';

                    const { error } = await supabaseClient
                        .from('proforma_invoices')
                        .update(updates)
                        .eq('id', id);

                    if (error) throw error;

                    api.notifications.show(`Marked as ${status}`, 'success');
                    await api.docs.fetch('proforma');
                    await api.reports.fetchStats();
                } catch (err) {
                    console.error('Payment Toggle Error:', err);
                    api.notifications.show('Failed to update status', 'error');
                }
            }
        },
        docs: {
            fetch: async (type) => {
                const tableMap = {
                    quotations: 'quotations', proforma: 'proforma_invoices', challans: 'delivery_challans',
                    credit_notes: 'credit_notes', debit_notes: 'debit_notes', purchase_orders: 'purchase_orders'
                };
                const table = tableMap[type];
                if (!table) return;

                try {
                    const { data, error } = await supabaseClient
                        .from(table)
                        .select('*, customers(name, billing_city, contact_phone)')
                        .order('created_at', { ascending: false });

                    if (error) throw error;

                    // Add safe mapping for old column names if needed
                    const mappedData = (data || []).map(item => ({
                        ...item,
                        customers: item.customers ? {
                            ...item.customers,
                            city: item.customers.billing_city,
                            phone: item.customers.contact_phone
                        } : null
                    }));

                    state[type] = mappedData;
                    render();
                } catch (err) {
                    console.error(`Fetch Error [${type}]:`, err);
                    api.notifications.show(`Failed to fetch ${type}: ` + err.message, 'error');
                }
            },
            convertToInvoice: async (pfiId) => {
                if (!confirm('Convert this Pro Forma Invoice to a Tax Invoice?')) return;

                try {
                    // 1. Fetch PFI and its items
                    const { data: pfi, error: pfiError } = await supabaseClient
                        .from('proforma_invoices')
                        .select('*, proforma_items(*, products(name, hsn))')
                        .eq('id', pfiId)
                        .single();

                    if (pfiError) throw pfiError;

                    // 2. Open Invoice Modal
                    ui.modal.open('invoice');

                    // 3. Mark source and active state
                    ui.invoice.sourcePfiId = pfi.id;
                    ui.invoice.activeId = null;

                    // 4. Map PFI fields to Invoice form
                    // Wait for modal to render
                    setTimeout(() => {
                        document.getElementById('inv-customer').value = pfi.customer_id;
                        document.getElementById('inv-customer-search').value = pfi.customers?.name || '';
                        document.getElementById('inv-type').value = pfi.type || 'Regular';
                        if (document.getElementById('inv-currency')) document.getElementById('inv-currency').value = pfi.currency || 'INR';
                        if (document.getElementById('inv-exchange-rate')) document.getElementById('inv-exchange-rate').value = '1.00';
                        document.getElementById('inv-bank').value = pfi.bank_id || 'inr';
                        document.getElementById('inv-purchase-no').value = pfi.metadata?.purchase_no || '';
                        if (pfi.metadata?.purchase_date) document.getElementById('inv-purchase-date').value = pfi.metadata.purchase_date;
                        document.getElementById('inv-notes').value = pfi.terms || '';
                        document.getElementById('inv-payment-terms').value = pfi.payment_terms || '';
                        document.getElementById('inv-delivery-time').value = pfi.delivery_time || '';
                        document.getElementById('inv-delivery-mode').value = pfi.delivery_mode || '';
                        if (document.getElementById('inv-bank-charges')) document.getElementById('inv-bank-charges').value = pfi.bank_charges || 0;

                        // Custom Fields
                        if (pfi.custom_fields && Array.isArray(pfi.custom_fields)) {
                            pfi.custom_fields.forEach(cf => ui.invoice.addCustomField(cf.name, cf.value));
                        }

                        // Line Items
                        const container = document.getElementById('inv-line-items');
                        container.innerHTML = '';
                        if (pfi.proforma_items && pfi.proforma_items.length > 0) {
                            pfi.proforma_items.forEach(item => {
                                ui.invoice.addItem({
                                    product_id: item.product_id,
                                    product_name: item.products?.name || '',
                                    hsn: item.hsn_code || item.products?.hsn || '',
                                    qty: item.qty,
                                    rate: item.rate,
                                    discount: item.discount || 0
                                });
                            });
                        }

                        ui.invoice.toggleExportFields();
                        ui.invoice.updateCalculations();
                        ui.invoice.updateDocNo();
                    }, 500);

                } catch (err) {
                    console.error('Conversion Error:', err);
                    api.notifications.show('Failed to convert PFI: ' + err.message, 'error');
                }
            },
            save: async (type) => {
                const btn = event.target;
                btn.disabled = true;
                btn.textContent = 'Saving...';

                try {
                    const tableMap = {
                        quotations: 'quotations', proforma: 'proforma_invoices', challans: 'delivery_challans',
                        credit_notes: 'credit_notes', debit_notes: 'debit_notes', purchase_orders: 'purchase_orders'
                    };
                    const itemTableMap = {
                        quotations: 'quotation_items', proforma: 'proforma_items', challans: 'challan_items',
                        credit_notes: 'credit_note_items', debit_notes: 'debit_note_items', purchase_orders: 'po_items'
                    };
                    const docIdFieldMap = {
                        quotations: 'quotation_id', proforma: 'proforma_id', challans: 'challan_id',
                        credit_notes: 'credit_note_id', debit_notes: 'debit_note_id', purchase_orders: 'po_id'
                    };

                    const doc = {
                        doc_no: document.getElementById('doc-no').value,
                        date: document.getElementById('doc-date').value,
                        customer_id: document.getElementById('doc-customer').value,
                        notes: document.getElementById('doc-notes').value,
                        total_amount: parseFloat(document.getElementById('doc-total').textContent.replace(/[₹,]/g, '')),
                        user_id: state.user.id
                    };

                    const { data: docData, error: docError } = await supabaseClient.from(tableMap[type]).insert(doc).select().single();

                    if (docError) throw docError;

                    const lineItems = [];
                    document.querySelectorAll('.doc-item-select').forEach(select => {
                        const row = select.closest('.line-item-row');
                        lineItems.push({
                            [docIdFieldMap[type]]: docData.id,
                            product_id: select.value,
                            qty: parseFloat(row.querySelector('.doc-item-qty').value),
                            rate: parseFloat(row.querySelector('.doc-item-rate').value),
                            user_id: state.user.id
                        });
                    });

                    const { error: itemError } = await supabaseClient.from(itemTableMap[type]).insert(lineItems);
                    if (itemError) throw itemError;

                    ui.modal.close();
                    await api.docs.fetch(type);
                    alert(`${type.charAt(0).toUpperCase() + type.slice(1, -1)} Saved Successfully!`);
                } catch (err) {
                    alert('Error: ' + err.message);
                } finally {
                    btn.disabled = false;
                    btn.textContent = 'Generate & Save';
                }
            },
            delete: async (type, id) => {
                if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
                const tableMap = {
                    quotations: 'quotations', proforma: 'proforma_invoices', challans: 'delivery_challans',
                    credit_notes: 'credit_notes', debit_notes: 'debit_notes', purchase_orders: 'purchase_orders'
                };
                try {
                    const { error } = await supabaseClient.from(tableMap[type]).delete().eq('id', id);
                    if (error) throw error;
                    await api.docs.fetch(type);
                } catch (err) {
                    alert('Delete failed: ' + err.message);
                }
            },
            generatePDF: async (type, id, includeSignature = true) => {
                try {
                    const tableMap = {
                        quotations: 'quotations', proforma: 'proforma_invoices', challans: 'delivery_challans',
                        credit_notes: 'credit_notes', debit_notes: 'debit_notes', purchase_orders: 'purchase_orders',
                        invoices: 'invoices'
                    };
                    const itemTableMap = {
                        quotations: 'quotation_items', proforma: 'proforma_items', challans: 'challan_items',
                        credit_notes: 'credit_note_items', debit_notes: 'debit_note_items', purchase_orders: 'po_items',
                        invoices: 'invoice_items'
                    };
                    const docIdFieldMap = {
                        quotations: 'quotation_id', proforma: 'proforma_id', challans: 'challan_id',
                        credit_notes: 'credit_note_id', debit_notes: 'debit_note_id', purchase_orders: 'po_id',
                        invoices: 'invoice_id'
                    };
                    const titleMap = {
                        quotations: 'QUOTATION', proforma: 'PRO FORMA INVOICE', challans: 'DELIVERY CHALLAN',
                        credit_notes: 'CREDIT NOTE', debit_notes: 'DEBIT NOTE', purchase_orders: 'PURCHASE ORDER',
                        invoices: 'TAX INVOICE'
                    };

                    const { data: doc, error: docErr } = await supabaseClient
                        .from(tableMap[type])
                        .select('*, customers(*)')
                        .eq('id', id)
                        .single();
                    if (docErr) throw docErr;

                    // Respect metadata preference if not explicitly overridden
                    if (doc.metadata && doc.metadata.include_signature !== undefined && includeSignature === true) {
                        includeSignature = doc.metadata.include_signature;
                    }

                    const { data: items, error: itemErr } = await supabaseClient
                        .from(itemTableMap[type])
                        .select('*, products(*)')
                        .eq(docIdFieldMap[type], id);
                    if (itemErr) throw itemErr;

                    const settings = state.settings || {};
                    const { jsPDF } = window.jspdf;
                    const pdf = new jsPDF();

                    // Register Poppins Font
                    if (window.FONTS_POPPINS_REGULAR) {
                        pdf.addFileToVFS('Poppins-Regular.ttf', window.FONTS_POPPINS_REGULAR);
                        pdf.addFont('Poppins-Regular.ttf', 'Poppins', 'normal');
                    }
                    if (window.FONTS_POPPINS_BOLD) {
                        pdf.addFileToVFS('Poppins-Bold.ttf', window.FONTS_POPPINS_BOLD);
                        pdf.addFont('Poppins-Bold.ttf', 'Poppins', 'bold');
                    }
                    pdf.setFont('Poppins', 'normal');

                    const pageWidth = pdf.internal.pageSize.width;
                    const pageHeight = pdf.internal.pageSize.height;
                    const margin = 10;

                    // Set PDF metadata for better browser tab title
                    const pdfDocNumber = doc.invoice_no || doc.doc_no || doc.quotation_no || doc.id.slice(0, 8);
                    pdf.setProperties({
                        title: `${titleMap[type]} - ${pdfDocNumber}`,
                        subject: titleMap[type],
                        author: settings.company_name || 'LaGa Systems',
                        keywords: 'invoice, gst, tax, business',
                        creator: 'LaGa Business Suite'
                    });

                    // Header Box
                    pdf.setDrawColor(0, 0, 0);
                    pdf.setLineWidth(0.1);
                    pdf.rect(margin, margin, pageWidth - (margin * 2), 10); // Top Title Box
                    pdf.setFontSize(10);
                    pdf.setFont('Poppins', 'bold');
                    pdf.text(titleMap[type], pageWidth / 2, margin + 7, { align: 'center' });
                    pdf.setFontSize(7);
                    pdf.text('ORIGINAL FOR RECIPIENT', pageWidth - margin - 2, margin + 7, { align: 'right' });

                    // Company Info Box (Left Half)
                    const leftBoxWidth = (pageWidth - (margin * 2)) / 2;
                    const textPadding = 22; // Unified indent from margin
                    const contentX = margin + textPadding;

                    // Dynamic Height Calculation (Max of Left and Right content)
                    const splitAddr = pdf.splitTextToSize(settings.address || '', leftBoxWidth - textPadding - 2);
                    const contactYStart = margin + 31 + (splitAddr.length * 4);
                    const lastTextY = contactYStart + 7;
                    const leftBoxHeight = (lastTextY + 1.5) - (margin + 10);

                    const detailsLineHeight = 4.5;
                    const visibleDetails = [
                        { label: `${type === 'quotations' ? 'Quotation' : type === 'proforma' ? 'Pro Forma Invoice' : 'Invoice'} No:`, value: doc.invoice_no || doc.doc_no || doc.quotation_no || doc.id.slice(0, 8), bold: true },
                        { label: 'Dated:', value: formatDate(doc.date) },
                        { label: 'Purchase No:', value: doc.purchase_no || doc.metadata?.purchase_no || '-', hide: type !== 'proforma' && type !== 'invoices' },
                        { label: 'Purchase Date:', value: (doc.purchase_date || doc.metadata?.purchase_date) ? formatDate(doc.purchase_date || doc.metadata.purchase_date) : '-', hide: type !== 'proforma' && type !== 'invoices' },
                        { label: 'Validity End Date:', value: doc.validity_date ? formatDate(doc.validity_date) : '-', hide: type !== 'quotations' && !doc.validity_date },
                        { label: 'Payment Terms:', value: doc.payment_terms || '-' },
                        { label: 'Delivery Time:', value: doc.delivery_time || '-' },
                        { label: 'Delivery Mode:', value: doc.delivery_mode || '-' }
                    ].filter(d => !d.hide);
                    const rightBoxHeight = 6 + (visibleDetails.length * detailsLineHeight) + 1.5;

                    const dynamicHeaderHeight = Math.max(leftBoxHeight, rightBoxHeight);

                    // Draw Boxes
                    pdf.rect(margin, margin + 10, leftBoxWidth, dynamicHeaderHeight);
                    const rightBoxX = margin + leftBoxWidth;
                    pdf.setLineWidth(0.1);
                    pdf.rect(rightBoxX, margin + 10, leftBoxWidth, dynamicHeaderHeight);

                    if (settings.company_logo) {
                        try {
                            pdf.addImage(settings.company_logo, 'PNG', margin + 3, margin + 12, 16, 16);
                        } catch (e) {
                            console.warn('Logo load failed', e);
                        }
                    }

                    pdf.setFontSize(10);
                    pdf.setFont('Poppins', 'bold');
                    pdf.text(settings.company_name || 'LaGa Systems Pvt Ltd', contentX, margin + 17);

                    pdf.setFontSize(7.5);
                    pdf.setFont('Poppins', 'normal');
                    pdf.text(`GSTIN: ${settings.gstin || '-'}`, contentX, margin + 22);
                    pdf.text(`PAN: ${settings.pan_no || '-'} | MSME: ${settings.msme_no || '-'}`, contentX, margin + 26);

                    pdf.text(splitAddr, contentX, margin + 31);

                    pdf.setFontSize(6.5);
                    pdf.setFont('Poppins', 'normal');
                    const cleanWeb = (settings.website || '').replace(/^https?:\/\//, '');
                    pdf.text(`Email: ${settings.company_email || '-'}`, contentX, contactYStart);
                    pdf.text(`Web: ${cleanWeb || '-'}`, contentX, contactYStart + 3.5);
                    pdf.text(`Ph: ${settings.company_phone || '-'}`, contentX, contactYStart + 7);

                    // Document Details Box (Right Half Content)
                    const detailX = rightBoxX + 5;
                    const labelOffset = 32;
                    let currentY = margin + 17.5;

                    visibleDetails.forEach((detail, idx) => {
                        pdf.setFontSize(8);
                        pdf.setFont('Poppins', 'normal');
                        pdf.text(detail.label, detailX, currentY);

                        if (detail.bold) pdf.setFont('Poppins', 'bold');
                        pdf.text(detail.value, detailX + labelOffset, currentY);

                        currentY += detailsLineHeight;
                    });

                    // Customer & Shipping Details Box - Dynamic Height Calculation
                    const customerDetailsY = margin + 10 + dynamicHeaderHeight;
                    const custBoxWidth = (pageWidth - (margin * 2)) / 2;

                    const getDisplayState = (code) => {
                        if (!code) return '';
                        const st = Constants.States.find(s => s.code === code || s.name === code);
                        return st ? st.name : code;
                    };

                    const billingAddr = `${doc.customers?.billing_address1 || ''} ${doc.customers?.billing_address2 || ''}\n${doc.customers?.billing_city || ''}${doc.customers?.billing_pincode ? ' ' + doc.customers.billing_pincode : ''}${doc.customers?.state ? ', ' + getDisplayState(doc.customers.state) : ''}\n${doc.customers?.billing_country || 'India'}`;
                    const splitBill = pdf.splitTextToSize(billingAddr, custBoxWidth - 10);
                    let customerHeadHeight = 9; // Base height for name
                    if (doc.customers?.gstin) customerHeadHeight += 4;
                    if (doc.customers?.pan_no) customerHeadHeight += 4;
                    const leftContentHeight = customerHeadHeight + 4 + (splitBill.length * 4);

                    const shippingAddr = `${doc.customers?.shipping_title || doc.customers?.name || ''}\n${doc.customers?.shipping_address1 || ''} ${doc.customers?.shipping_address2 || ''}\n${doc.customers?.shipping_city || ''}${doc.customers?.shipping_pincode ? ' ' + doc.customers.shipping_pincode : ''}${doc.customers?.state ? ', ' + getDisplayState(doc.customers.state) : ''}\n${doc.customers?.shipping_country || 'India'}`;
                    const splitShip = pdf.splitTextToSize(shippingAddr, custBoxWidth - 10);
                    const rightContentHeight = 9 + (splitShip.length * 4); // Start Y (9) + split text height

                    const custBoxDynamicHeight = Math.max(leftContentHeight, rightContentHeight) + 1.5; // 1-point buffer

                    // Draw Boxes
                    pdf.rect(margin, customerDetailsY, custBoxWidth, custBoxDynamicHeight);
                    pdf.rect(margin + custBoxWidth, customerDetailsY, custBoxWidth, custBoxDynamicHeight);

                    // Left Content
                    pdf.setFontSize(7);
                    pdf.setFont('Poppins', 'bold');
                    pdf.text('Billing Address:', margin + 2, customerDetailsY + 4);
                    pdf.setFontSize(9);
                    pdf.text(doc.customers?.name || 'Walk-in Customer', margin + 2, customerDetailsY + 9);

                    // Add GSTIN/PAN if available
                    let currentCustY = customerDetailsY + 13;
                    if (doc.customers?.gstin) {
                        pdf.setFontSize(7);
                        pdf.setFont('Poppins', 'bold');
                        pdf.text(`GSTIN: ${doc.customers.gstin}`, margin + 2, currentCustY);
                        currentCustY += 4;
                    }
                    if (doc.customers?.pan_no) {
                        pdf.setFontSize(7);
                        pdf.setFont('Poppins', 'bold');
                        pdf.text(`PAN: ${doc.customers.pan_no}`, margin + 2, currentCustY);
                        currentCustY += 4;
                    }

                    pdf.setFontSize(8);
                    pdf.setFont('Poppins', 'normal');
                    pdf.text(splitBill, margin + 2, currentCustY + 1);

                    // Right Content
                    pdf.setFontSize(7);
                    pdf.setFont('Poppins', 'bold');
                    pdf.text('Shipping address:', margin + custBoxWidth + 2, customerDetailsY + 4);
                    pdf.setFontSize(8);
                    pdf.setFont('Poppins', 'normal');
                    pdf.text(splitShip, margin + custBoxWidth + 2, customerDetailsY + 9);

                    // Main Table - Starts after dynamic box
                    const tableStartY = customerDetailsY + custBoxDynamicHeight;

                    // Main Table
                    // Main Table Data Calculation
                    let totalQty = 0;
                    let totalTaxable = 0;
                    let totalTaxAmt = 0;
                    let totalGrand = 0;

                    const getStateCode = (val, gstinFallback) => {
                        // 1. Try specified value (e.g. "27 - Maharashtra")
                        if (val) {
                            const str = String(val);
                            const code = str.includes('-') ? str.split('-')[0].trim() : str.trim();
                            if (code && code.length === 2 && !isNaN(code)) return code;
                        }
                        // 2. Try GSTIN fallback (first 2 digits)
                        if (gstinFallback) {
                            const code = String(gstinFallback).substring(0, 2);
                            if (code && code.length === 2 && !isNaN(code)) return code;
                        }
                        return '27'; // Final fallback
                    };

                    const myStateCode = getStateCode(settings?.state, settings?.gstin);
                    const customerStateCode = getStateCode(doc.customers?.state, doc.customers?.gstin);
                    const isInterState = customerStateCode !== myStateCode;

                    const currency = doc.currency || 'INR';
                    const symbol = { 'INR': 'Rs.', 'USD': '$', 'EUR': '€' }[currency] || currency;
                    const exchangeRate = parseFloat(doc.exchange_rate) || 1.0;

                    const hasDiscount = items.some(i => (i.discount || 0) > 0);

                    const tableData = items.map((item, idx) => {
                        const amount = item.qty * item.rate;
                        const discPct = item.discount || 0;
                        const discAmt = (amount * discPct) / 100;
                        const taxable = amount - discAmt;
                        const gstRate = item.products?.gst || 0;
                        const taxAmt = (taxable * gstRate) / 100;
                        const total = taxable + taxAmt;

                        totalQty += item.qty;
                        totalTaxable += taxable;
                        totalTaxAmt += taxAmt;
                        totalGrand += total;

                        const row = [
                            idx + 1,
                            item.products?.name || 'Custom Item',
                            item.products?.hsn || '-',
                            item.qty,
                            item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })
                        ];

                        if (hasDiscount) {
                            row.push(`${discPct}%`);
                        }

                        row.push(taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 }));

                        if (isInterState) {
                            row.push(`${gstRate}%`);
                            row.push(taxAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 }));
                        } else {
                            const halfRate = gstRate / 2;
                            const halfAmt = taxAmt / 2;
                            row.push(`${halfRate}%`);
                            row.push(halfAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 }));
                            row.push(`${halfRate}%`);
                            row.push(halfAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 }));
                        }

                        row.push(total.toLocaleString('en-IN', { minimumFractionDigits: 2 }));
                        return row;
                    });

                    const headerRow1 = [
                        { content: 'Sr.\nNo.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                        { content: 'Name of Product / Service', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                        { content: 'HSN / SAC', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                        { content: 'Qty', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                        { content: `Rate (${symbol})`, rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
                    ];

                    if (hasDiscount) {
                        headerRow1.push({ content: 'Disc.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } });
                    }

                    headerRow1.push({ content: 'Taxable Value', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } });

                    if (isInterState) {
                        headerRow1.push({ content: 'IGST', colSpan: 2, styles: { halign: 'center', valign: 'middle' } });
                    } else {
                        headerRow1.push({ content: 'CGST', colSpan: 2, styles: { halign: 'center', valign: 'middle' } });
                        headerRow1.push({ content: 'SGST', colSpan: 2, styles: { halign: 'center', valign: 'middle' } });
                    }

                    headerRow1.push({ content: 'Total', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } });

                    const headerRow2 = [];
                    if (isInterState) {
                        headerRow2.push({ content: '%', styles: { halign: 'center' } }, { content: 'Amount', styles: { halign: 'center' } });
                    } else {
                        headerRow2.push({ content: '%', styles: { halign: 'center' } }, { content: 'Amount', styles: { halign: 'center' } });
                        headerRow2.push({ content: '%', styles: { halign: 'center' } }, { content: 'Amount', styles: { halign: 'center' } });
                    }

                    const headRows = [headerRow1, headerRow2];

                    const baseColStyles = {
                        0: { cellWidth: 8, halign: 'center' }, // Sr No
                        1: { cellWidth: 'auto' },              // Name
                        2: { cellWidth: 15, halign: 'center' }, // HSN
                        3: { cellWidth: 10, halign: 'center' }, // Qty
                        4: { cellWidth: 20, halign: 'right' }   // Rate
                    };

                    let colIdx = 5;
                    if (hasDiscount) {
                        baseColStyles[colIdx++] = { cellWidth: 10, halign: 'center' }; // Disc
                    }

                    baseColStyles[colIdx++] = { cellWidth: 22, halign: 'right' }; // Taxable Value

                    if (isInterState) {
                        baseColStyles[colIdx++] = { cellWidth: 10, halign: 'center' }; // IGST %
                        baseColStyles[colIdx++] = { cellWidth: 18, halign: 'right' };  // IGST Amt
                    } else {
                        baseColStyles[colIdx++] = { cellWidth: 8, halign: 'center' };  // CGST %
                        baseColStyles[colIdx++] = { cellWidth: 15, halign: 'right' };  // CGST Amt
                        baseColStyles[colIdx++] = { cellWidth: 8, halign: 'center' };  // SGST %
                        baseColStyles[colIdx++] = { cellWidth: 15, halign: 'right' };  // SGST Amt
                    }

                    baseColStyles[colIdx++] = { cellWidth: 25, halign: 'right' }; // Total

                    pdf.autoTable({
                        startY: tableStartY,
                        head: headRows,
                        body: tableData,
                        foot: [
                            [
                                { content: 'Total', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
                                { content: totalQty, styles: { halign: 'center', fontStyle: 'bold' } },
                                { content: '', styles: { fillColor: [240, 240, 240] } }, // Rate
                                ...(hasDiscount ? [{ content: '', styles: { fillColor: [240, 240, 240] } }] : []), // Disc
                                { content: totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
                                ...(isInterState
                                    ? [{ content: '', styles: { fillColor: [240, 240, 240] } }, { content: totalTaxAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } }]
                                    : [
                                        { content: '', styles: { fillColor: [240, 240, 240] } },
                                        { content: (totalTaxAmt / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
                                        { content: '', styles: { fillColor: [240, 240, 240] } },
                                        { content: (totalTaxAmt / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } }
                                    ]
                                ),
                                { content: totalGrand.toLocaleString('en-IN', { minimumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } }
                            ],
                            ...(doc.bank_charges > 0 ? [[
                                { content: 'Bank Charges', colSpan: colIdx - 1, styles: { halign: 'right', fontStyle: 'bold' } },
                                { content: doc.bank_charges.toLocaleString('en-IN', { minimumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } }
                            ]] : []),
                            ...(doc.metadata?.round_off ? [[
                                { content: 'Round Off', colSpan: colIdx - 1, styles: { halign: 'right', fontStyle: 'bold' } },
                                { content: (doc.total_amount - (totalGrand + (doc.bank_charges || 0))).toLocaleString('en-IN', { minimumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } }
                            ]] : []),
                            [
                                { content: 'Grand Total', colSpan: colIdx - 1, styles: { halign: 'right', fontStyle: 'bold' } },
                                { content: doc.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } }
                            ]
                        ],
                        theme: 'grid',
                        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, fontStyle: 'bold', fontSize: 7, font: 'Poppins' },
                        footStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, fontSize: 7, font: 'Poppins' },
                        styles: { fontSize: 7, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.1, font: 'Poppins' },
                        columnStyles: baseColStyles,
                        margin: { left: margin, right: margin }
                    });

                    let finalY = pdf.lastAutoTable.finalY;


                    finalY += 5;

                    // Amount in Words
                    const wordBoxHeight = 10;
                    pdf.setLineWidth(0.1);
                    pdf.rect(margin, finalY, pageWidth - (margin * 2), wordBoxHeight);
                    pdf.setFontSize(8);
                    pdf.setFont('Poppins', 'normal');
                    pdf.text(`Amount Chargeable (in words): ${doc.currency || 'INR'} ${numberToWords(doc.total_amount, doc.currency)}`, margin + 2, finalY + 6.5);
                    pdf.setFontSize(8);
                    pdf.setFont('Poppins', 'bolditalic');
                    pdf.text('E & O.E', pageWidth - margin - 15, finalY + 6.5);

                    finalY += wordBoxHeight;

                    // HSN Summary Table - Improved styling and grid lines
                    const hsnSummary = items.reduce((acc, item) => {
                        const hsn = item.products?.hsn || '-';
                        const taxableBase = item.qty * item.rate * (1 - (item.discount || 0) / 100);
                        const taxable = taxableBase * exchangeRate;
                        const rate = item.products?.gst || 0;
                        const tax = (taxable * rate) / 100;

                        if (!acc[hsn]) acc[hsn] = { taxable: 0, tax: 0, rate };
                        acc[hsn].taxable += taxable;
                        acc[hsn].tax += tax;
                        return acc;
                    }, {});

                    const hsnRows = Object.entries(hsnSummary).map(([hsn, data]) => {
                        if (isInterState) {
                            return [hsn, data.taxable.toFixed(2), `${data.rate}%`, data.tax.toFixed(2), '-', '-', data.tax.toFixed(2)];
                        } else {
                            return [hsn, data.taxable.toFixed(2), `${(data.rate / 2).toFixed(1)}%`, (data.tax / 2).toFixed(2), `${(data.rate / 2).toFixed(1)}%`, (data.tax / 2).toFixed(2), data.tax.toFixed(2)];
                        }
                    });

                    pdf.autoTable({
                        startY: finalY,
                        head: [[
                            { content: 'HSN/SAC', rowSpan: 2 },
                            { content: 'Taxable Value', rowSpan: 2 },
                            { content: 'Central Tax', colSpan: 2 },
                            { content: 'State Tax', colSpan: 2 },
                            { content: 'Total Tax Amount', rowSpan: 2 }
                        ], ['Rate', 'Amount', 'Rate', 'Amount']],
                        body: hsnRows,
                        theme: 'grid',
                        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, fontSize: 7, halign: 'center', fontStyle: 'bold', font: 'Poppins' },
                        styles: { fontSize: 7, halign: 'right', lineColor: [0, 0, 0], lineWidth: 0.1, cellPadding: 2, font: 'Poppins' },
                        columnStyles: {
                            0: { halign: 'left', cellWidth: 30 },
                            1: { cellWidth: 35 },
                            2: { cellWidth: 20 },
                            3: { cellWidth: 25 },
                            4: { cellWidth: 20 },
                            5: { cellWidth: 25 },
                            6: { cellWidth: 'auto' }
                        },
                        margin: { left: margin, right: margin }
                    });

                    finalY = pdf.lastAutoTable.finalY + 5;

                    // Custom Specifications Table (if any)
                    if ((type === 'proforma' || type === 'quotations') && doc.metadata?.custom_fields && doc.metadata.custom_fields.length > 0) {
                        if (finalY + 20 > pageHeight - 60) { pdf.addPage(); finalY = margin; }

                        pdf.setFontSize(8);
                        pdf.setFont('Poppins', 'bold');
                        pdf.text('Custom Specifications:', margin, finalY + 4);

                        const cfRows = doc.metadata.custom_fields.map(cf => [cf.name, cf.value]);
                        pdf.autoTable({
                            startY: finalY + 6,
                            head: [['Field Name / Specification', 'Value / Details']],
                            body: cfRows,
                            theme: 'grid',
                            headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], lineWidth: 0.1, fontSize: 7, fontStyle: 'bold', font: 'Poppins' },
                            styles: { fontSize: 7, lineColor: [0, 0, 0], lineWidth: 0.1, cellPadding: 2, font: 'Poppins' },
                            margin: { left: margin, right: margin }
                        });
                        finalY = pdf.lastAutoTable.finalY + 5;
                    } else {
                        finalY = pdf.lastAutoTable.finalY + 5;
                    }

                    // Custom Fields Section (if any)
                    if (doc.custom_fields && Array.isArray(doc.custom_fields) && doc.custom_fields.length > 0) {
                        const customFieldsHeight = 5 + (doc.custom_fields.length * 5);
                        if (finalY + customFieldsHeight > pageHeight - 60) {
                            pdf.addPage();
                            finalY = margin;
                        }

                        pdf.setLineWidth(0.1);
                        pdf.rect(margin, finalY, pageWidth - (margin * 2), customFieldsHeight);

                        pdf.setFontSize(7);
                        pdf.setFont('Poppins', 'bold');
                        pdf.text('Additional Information:', margin + 2, finalY + 4);

                        pdf.setFont('Poppins', 'normal');
                        let cfY = finalY + 9;
                        doc.custom_fields.forEach(cf => {
                            if (cf.name && cf.value) {
                                pdf.setFont('Poppins', 'bold');
                                pdf.text(`${cf.name}:`, margin + 2, cfY);
                                pdf.setFont('Poppins', 'normal');
                                pdf.text(cf.value, margin + 40, cfY);
                                cfY += 5;
                            }
                        });

                        finalY += customFieldsHeight + 2;
                    }

                    // Footer Row 1: Bank Details & QR & Signature
                    const footerHeight = 45;
                    if (finalY + footerHeight > pageHeight - 20) { pdf.addPage(); finalY = margin; }
                    pdf.setLineWidth(0.1);
                    pdf.rect(margin, finalY, pageWidth - (margin * 2), footerHeight);

                    // Bank Details - Based on Transaction Type
                    pdf.setFontSize(7);
                    pdf.setFont('Poppins', 'bold');
                    pdf.text('Bank Details:', margin + 2, finalY + 6);
                    pdf.setFont('Poppins', 'normal');
                    // Use USD bank for LUT/Export, INR bank for Regular and Without GST
                    const bankPrefix = (doc.type === 'LUT / Export') ? 'bank_usd' : 'bank_inr';
                    pdf.text(`Bank Name:`, margin + 2, finalY + 12);
                    pdf.text(settings[`${bankPrefix}_name`] || '-', margin + 30, finalY + 12);
                    pdf.text(`Account No:`, margin + 2, finalY + 17);
                    pdf.text(settings[`${bankPrefix}_acc_no`] || '-', margin + 30, finalY + 17);
                    const isUsd = bankPrefix === 'bank_usd';
                    const codeLabel = isUsd ? 'SWIFT Code:' : 'IFSC Code:';
                    const codeField = isUsd ? 'swift' : 'ifsc';
                    pdf.text(codeLabel, margin + 2, finalY + 22);
                    pdf.text(settings[`${bankPrefix}_${codeField}`] || '-', margin + 30, finalY + 22);
                    pdf.text(`Branch:`, margin + 2, finalY + 27);
                    pdf.text(settings[`${bankPrefix}_branch`] || '-', margin + 30, finalY + 27);



                    // Signature (Right)
                    pdf.setFontSize(8);
                    pdf.setFont('Poppins', 'bold');
                    pdf.text(`For ${settings.company_name || 'LaGa Systems'}`, pageWidth - margin - 2, finalY + 8, { align: 'right' });

                    if (includeSignature) {
                        const sigX = pageWidth - margin - 45;
                        const sigY = finalY + 12;
                        const sigW = 40;
                        const sigH = 20;

                        if (settings.signature) {
                            try {
                                pdf.addImage(settings.signature, 'PNG', sigX, sigY, sigW, sigH);
                            } catch (e) {
                                pdf.rect(sigX, sigY, sigW, sigH);
                                pdf.setFontSize(6);
                                pdf.text('AUTHORIZED SIGNATORY', sigX + 20, sigY + 18, { align: 'center' });
                            }
                        } else {
                            pdf.rect(sigX, sigY, sigW, sigH);
                            pdf.setFontSize(6);
                            pdf.text('AUTHORIZED SIGNATORY', sigX + 20, sigY + 18, { align: 'center' });
                        }
                    }

                    pdf.setFontSize(7);
                    pdf.text('Authorized Signatory', pageWidth - margin - 2, finalY + 40, { align: 'right' });

                    finalY += footerHeight + 5;

                    // Notes & Terms
                    if (finalY + 40 > pageHeight - 10) { pdf.addPage(); finalY = margin; }
                    pdf.setLineWidth(0.1);
                    pdf.rect(margin, finalY, pageWidth - (margin * 2), 35);
                    pdf.setFont('Poppins', 'bold');
                    pdf.text('Terms and Conditions:', margin + 2, finalY + 5);
                    pdf.setFont('Poppins', 'normal');
                    const splitTerms = pdf.splitTextToSize(doc.terms || '1. Goods once sold cannot be taken back.\n2. Subject to local Jurisdiction.', pageWidth - (margin * 2) - 4);
                    pdf.text(splitTerms, margin + 2, finalY + 10);

                    // Bottom page flag
                    pdf.setFontSize(6);
                    const now = new Date();
                    const printDateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                    const genDate = new Date(doc.date);
                    const genDateStr = genDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                    const userStr = state.user?.email || 'User';
                    pdf.text(`Page 1/1   Generated on ${genDateStr} | Printed by ${userStr} on ${printDateStr}`, margin, pageHeight - 5);

                    // Display PDF in embedded modal viewer
                    const pdfBlob = pdf.output('blob');
                    const pdfUrl = URL.createObjectURL(pdfBlob);

                    // Create modal with embedded PDF viewer
                    const modal = document.createElement('div');
                    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center;';

                    const modalContent = document.createElement('div');
                    modalContent.style.cssText = 'width: 90%; height: 90%; background: white; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column;';

                    const header = document.createElement('div');
                    header.style.cssText = 'padding: 16px; background: #f8f9fa; border-bottom: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center;';
                    const docNumber = doc.invoice_no || doc.doc_no || doc.quotation_no || doc.id.slice(0, 8);
                    const filename = `${docNumber}.pdf`;
                    header.innerHTML = `
                                                    <h3 style="margin: 0; font-size: 18px; font-weight: 600;">${titleMap[type]} - ${docNumber}</h3>
                                                    <div style="display: flex; gap: 12px; align-items: center;">
                                                        <label style="display: flex; align-items: center; gap: 6px; font-size: 14px; cursor: pointer;">
                                                            <input type="checkbox" id="signature-toggle" ${includeSignature ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px;">
                                                            <span style="font-weight: 500;">Include Signature</span>
                                                        </label>
                                                        <a href="${pdfUrl}" download="${filename}" style="padding: 8px 16px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">Download PDF</a>
                                                        <button onclick="this.closest('[style*=fixed]').remove(); URL.revokeObjectURL('${pdfUrl}')" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6c757d;">&times;</button>
                                                    </div>
                                                    `;

                    const iframe = document.createElement('iframe');
                    iframe.src = pdfUrl;
                    iframe.style.cssText = 'flex: 1; border: none; width: 100%;';

                    modalContent.appendChild(header);
                    modalContent.appendChild(iframe);
                    modal.appendChild(modalContent);
                    document.body.appendChild(modal);

                    // Add signature toggle event listener
                    const signatureToggle = header.querySelector('#signature-toggle');
                    if (signatureToggle) {
                        signatureToggle.addEventListener('change', async (e) => {
                            // Remove current modal
                            modal.remove();
                            URL.revokeObjectURL(pdfUrl);
                            // Regenerate PDF with new signature setting
                            await api.docs.generatePDF(type, id, e.target.checked);
                        });
                    }

                    // Close on background click
                    modal.addEventListener('click', (e) => {
                        if (e.target === modal) {
                            modal.remove();
                            URL.revokeObjectURL(pdfUrl);
                        }
                    });
                } catch (err) {
                    console.error('PDF Error:', err);
                    alert('PDF Generation failed: ' + err.message);
                }
            },
        }
    };

    // Global Exposure for event listeners
    window.ui = ui;
    window.api = api;

    // Launch
    window.onload = function () {
        init();
    };

} catch (e) {
    console.error('CRITICAL STARTUP ERROR:', e);
    alert('CRITICAL STARTUP ERROR: ' + e.message);
}
