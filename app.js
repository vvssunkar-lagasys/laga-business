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
        ui.spotlight.init();

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

            // 6. Start Live Clock
            setInterval(() => {
                const clockEl = document.getElementById('dashboard-clock');
                if (clockEl) {
                    clockEl.textContent = getFormattedTime();
                }
            }, 1000);
        }
    };

    const setupGlobalListeners = () => {
        el.loginForm?.addEventListener('submit', handleLogin);
        document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
        
        // Sidebar Toggle
        document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
            el.mainRoot.classList.toggle('sidebar-collapsed');
        });
        window.addEventListener('hashchange', () => {
            state.view = window.location.hash.slice(1) || 'dashboard';
            render();
        });

        el.fySelect?.addEventListener('change', async (e) => {
            state.fy = e.target.value;
            await api.reports.fetchStats();
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

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const getFormattedDate = () => {
        const now = new Date();
        const suffix = (day) => {
            if (day > 3 && day < 21) return 'th';
            switch (day % 10) {
                case 1: return 'st';
                case 2: return 'nd';
                case 3: return 'rd';
                default: return 'th';
            }
        };

        const day = now.getDate();
        const month = now.toLocaleString('en-US', { month: 'long' });
        const year = now.getFullYear();
        const weekday = now.toLocaleString('en-US', { weekday: 'long' });

        return `${weekday}, ${month} ${day}${suffix(day)} ${year}`;
    };

    const getFormattedTime = () => {
        return new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    // --- Views & Components (Templates) ---
    const Templates = {
        Dashboard: (data) => {
            // Calculate additional metrics
            const invoices = state.invoices.filter(i => isWithinFY(i.date, state.fy));
            const quotations = state.quotations.filter(q => isWithinFY(q.date, state.fy));
            const totalInvoices = invoices.length;
            const paidInvoices = invoices.filter(i => i.status === 'Paid').length;
            const pendingInvoices = invoices.filter(i => i.status === 'Pending').length;
            const overdueInvoices = invoices.filter(i => i.status === 'Pending' && new Date(i.due_date) < new Date()).length;

            // Currency breakdown
            const inrInvoices = invoices.filter(i => (i.currency || 'INR') === 'INR');
            const usdInvoices = invoices.filter(i => i.currency === 'USD');
            const inrRevenue = inrInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
            const usdRevenue = usdInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);

            // MoM Comparison logic
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

            const thisMonthInvoices = invoices.filter(i => {
                const d = new Date(i.date);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            });
            const lastMonthInvoices = state.invoices.filter(i => {
                const d = new Date(i.date);
                return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
            });

            const thisMonthSales = thisMonthInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
            const lastMonthSales = lastMonthInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);

            const salesGrowth = lastMonthSales > 0 ? ((thisMonthSales - lastMonthSales) / lastMonthSales * 100) : 100;

            const userName = state.user?.email ? state.user.email.split('@')[0] : 'User';
            const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1);

            return `
            <div class="dashboard-welcome-section mb-8 animate-fade-in">
                <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div class="flex flex-col">
                        <h1 class="text-3xl font-bold text-slate-900 tracking-tight">${getGreeting()}, ${capitalizedName}! 👋</h1>
                        <p class="text-slate-500 font-medium mt-1 flex items-center gap-2">
                            <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                            ${getFormattedDate()}
                        </p>
                    </div>
                    <div class="dashboard-clock-container bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                        <div class="relative flex h-2 w-2">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </div>
                        <span id="dashboard-clock" class="text-xl font-bold text-slate-800 tabular-nums">
                            ${getFormattedTime()}
                        </span>
                    </div>
                </div>
            </div>
            <!-- Enhanced Stats Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
                <!-- Total Sales Card -->
                <div class="dashboard-stat-card gradient-blue">
                    <div class="stat-icon">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>
                    <div class="stat-content">
                        <p class="stat-label">Total Sales</p>
                        <h4 class="stat-value tabular-nums">₹${data.sales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h4>
                    </div>
                </div>

                <!-- Tax Collected Card -->
                <div class="dashboard-stat-card gradient-emerald">
                    <div class="stat-icon">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                        </svg>
                    </div>
                    <div class="stat-content">
                        <p class="stat-label">Tax Collected</p>
                        <h4 class="stat-value tabular-nums">₹${data.tax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h4>
                        <div class="stat-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${Math.min(100, (data.tax / data.sales * 100))}%"></div>
                            </div>
                            <span class="progress-label">${((data.tax / data.sales * 100) || 0).toFixed(1)}% of sales</span>
                        </div>
                    </div>
                </div>

                <!-- Total Quotations Card -->
                <div class="dashboard-stat-card gradient-orange">
                    <div class="stat-icon">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
                        </svg>
                    </div>
                    <div class="stat-content">
                        <p class="stat-label">Total Quotations</p>
                        <h4 class="stat-value tabular-nums">${quotations.length}</h4>
                        <p class="stat-subtitle">Drafts & Sent</p>
                    </div>
                </div>

                <!-- Total Invoices Card -->
                <div class="dashboard-stat-card gradient-indigo">
                    <div class="stat-icon">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                    </div>
                    <div class="stat-content">
                        <p class="stat-label">Total Invoices</p>
                        <h4 class="stat-value tabular-nums">${totalInvoices}</h4>
                        <div class="stat-breakdown">
                            <span class="breakdown-item paid">${paidInvoices} Paid</span>
                            <span class="breakdown-item pending">${pendingInvoices} Pending</span>
                        </div>
                    </div>
                </div>


            </div>

            <!-- Multi-Currency Section -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <!-- INR Revenue -->
                <div class="currency-card inr-card">
                    <div class="currency-header">
                        <div class="currency-icon">₹</div>
                        <div>
                            <h5 class="currency-label">INR Revenue</h5>
                            <p class="currency-count">${inrInvoices.length} invoices</p>
                        </div>
                    </div>
                    <h3 class="currency-amount tabular-nums">₹${inrRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
                    <div class="currency-chart">
                        <div class="mini-bar" style="width: ${inrRevenue > 0 ? '100%' : '0%'}"></div>
                    </div>
                </div>

                <!-- USD Revenue -->
                <div class="currency-card usd-card">
                    <div class="currency-header">
                        <div class="currency-icon">$</div>
                        <div>
                            <h5 class="currency-label">USD Revenue (Exports)</h5>
                            <p class="currency-count">${usdInvoices.length} invoices</p>
                        </div>
                    </div>
                    <h3 class="currency-amount tabular-nums">$${usdRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</h3>
                    <div class="currency-chart">
                        <div class="mini-bar usd" style="width: ${usdRevenue > 0 ? '100%' : '0%'}"></div>
                    </div>
                </div>
            </div>

            <!-- Enhanced Analytics Section -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                <!-- Revenue Trend Chart -->
                <div class="analytics-card lg:col-span-3">
                    <div class="flex items-center justify-between mb-4">
                        <h5 class="analytics-title">Revenue Trend (FY ${state.fy})</h5>
                        <div class="text-xs text-slate-400">Monthly breakdown in ₹</div>
                    </div>
                    <div style="height: 300px; position: relative;">
                        <canvas id="revenueTrendChart"></canvas>
                    </div>
                </div>
            </div>
        `;
        },
        Customers: (items) => `
        <div class="animate-fade-in">
            <div class="dashboard-header">
                <div class="dashboard-title">
                    <h2 class="text-2xl font-bold">Customers</h2>
                </div>
            </div>

            <div class="status-tabs">
                <div class="tab-item active">All Customers <span class="tab-count">${items.length}</span></div>
            </div>

            <div class="toolbar">
                <div class="search-container">
                    <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <input type="text" class="form-input search-input" placeholder="Search customers by name, company, phone etc.." value="${ui.customers.searchQuery || ''}" oninput="ui.customers.search(this.value)">
                </div>
                <div class="ml-auto flex items-center gap-2">

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
                            <th>Financials</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm">
                        ${items.map(c => {
            const stateName = Constants.States.find(s => s.code === c.state)?.name.split(' - ')[1] || c.state || '-';
            const invs = state.invoices.filter(i => i.customer_id === c.id);
            const totalRev = invs.reduce((sum, i) => sum + (i.total_amount || 0), 0);
            const totalPaid = invs.filter(i => i.status === 'Paid').reduce((sum, i) => sum + (i.total_amount || 0), 0);
            const outstanding = totalRev - totalPaid;

            return `
                            <tr class="product-row border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                <td class="p-4">
                                    <div class="flex items-center gap-3">
                                        <div class="item-avatar" style="${ui.utils.getAvatarStyle(c.name)}">${c.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div>
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
                                    <div class="customer-financials">
                                        <div class="fin-chip revenue" title="Total Sales">
                                            <span class="fin-label">Sales</span>
                                            <span class="fin-amount">₹${totalRev.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                        </div>
                                        <div class="fin-chip ${outstanding > 0 ? 'outstanding' : 'neutral'}" title="${outstanding > 0 ? 'Outstanding Balance' : 'Full Settled'}">
                                            <span class="fin-label">${outstanding > 0 ? 'Due' : 'Cleared'}</span>
                                            <span class="fin-amount">${outstanding > 0 ? '₹' + outstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td class="p-4">
                                    <div class="flex items-center gap-2">
                                        <button onclick="ui.customer.view('${c.id}')" class="text-slate-400 hover:text-blue-600 transition-colors" title="View Details">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                        </button>
                                        <button onclick="api.docs.generateLedger('${c.id}')" class="text-slate-400 hover:text-emerald-600 transition-colors" title="Statement of Account">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
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
                            <button onclick="ui.invoice.activeId = null; ui.modal.open('invoice')" class="bg-[#3b82f6] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center gap-2">
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
                        </div>
                        <div class="flex items-center gap-4">

                            <button onclick="ui.quotation_v2.activeId = null; ui.quotation_v2.activeStatus = null; ui.modal.open('quotation-new')" class="bg-[#3b82f6] text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-600 transition-all">+ Create Quotation</button>
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
                                                <button onclick="api.docs.convertQuotationToProForma('${q.id}')" class="p-2 rounded-lg hover:bg-purple-50 text-purple-500 transition-colors" title="Convert to Pro Forma Invoice">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                </button>
                                                <button onclick="api.docs.convertQuotationToInvoice('${q.id}')" class="p-2 rounded-lg hover:bg-emerald-50 text-emerald-500 transition-colors" title="Convert to Tax Invoice">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                                                </button>
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
                                                <button onclick="ui.quotation_v2.activeId = null; ui.quotation_v2.activeStatus = null; ui.modal.open('quotation-new')" class="mt-6 bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:scale-105 transition-all">Create New Quotation</button>
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

            <!-- Consolidated Monthly HSN-Wise Summary (Table 12) -->
            <div class="space-y-8 mt-12 pt-12 border-t border-slate-100">
                <div class="flex items-center justify-between px-2">
                    <div class="flex flex-col">
                        <h3 class="text-3xl font-black text-slate-900 flex items-center gap-4">
                            <div class="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-200">
                                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            </div>
                            HSN-Wise Summary (Table 12)
                        </h3>
                        <p class="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mt-3 ml-1">Monthly Outward Supplies Breakdown</p>
                    </div>
                    <div class="flex items-center gap-4">
                        <button onclick="api.reports.exportHSNToExcel()" class="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95 group">
                            <svg class="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            Export Excel
                        </button>
                        <div class="flex flex-col items-end gap-1">
                            <span class="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100">Official Return Data</span>
                            <p class="text-[8px] text-slate-300 font-bold uppercase tracking-widest mr-1">Auto-aggregated</p>
                        </div>
                    </div>
                </div>

                ${(() => {
                const months = Object.keys(data.hsnByMonth || {});
                if (months.length === 0) {
                    return `
                                <div class="glass p-20 text-center rounded-3xl border border-slate-100 bg-white/80 backdrop-blur-md">
                                    <div class="text-4xl mb-4">📊</div>
                                    <h4 class="text-slate-900 font-bold text-lg">No HSN Data Found</h4>
                                    <p class="text-slate-500 text-sm max-w-xs mx-auto">Transaction records for the selected FY are required to generate this summary.</p>
                                </div>
                            `;
                }

                const monthOrder = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                const sortedMonths = months.sort((a, b) => {
                    const [mA, yA] = a.split(' ');
                    const [mB, yB] = b.split(' ');
                    if (yA !== yB) return yA - yB;
                    return monthOrder.indexOf(mA) - monthOrder.indexOf(mB);
                });

                let grandTaxable = 0;
                let grandCGST = 0;
                let grandSGST = 0;
                let grandIGST = 0;
                let grandQty = 0;

                const tableRows = sortedMonths.map(month => {
                    const domestic = Object.values(data.hsnByMonth[month].domestic || {});
                    const exports = Object.values(data.hsnByMonth[month].exports || {});

                    const combined = [
                        ...domestic.map(h => ({ ...h, category: 'Domestic', color: 'text-blue-600', bgColor: 'bg-blue-50/50', borderColor: 'border-blue-100' })),
                        ...exports.map(h => ({ ...h, category: 'Export', color: 'text-emerald-600', bgColor: 'bg-emerald-50/50', borderColor: 'border-emerald-100' }))
                    ];

                    if (combined.length === 0) return '';

                    const monthlyTaxable = combined.reduce((s, h) => s + h.taxable, 0);
                    const monthlyCGST = combined.reduce((s, h) => s + h.cgst, 0);
                    const monthlySGST = combined.reduce((s, h) => s + h.sgst, 0);
                    const monthlyIGST = combined.reduce((s, h) => s + h.igst, 0);
                    const monthlyQty = combined.reduce((s, h) => s + h.count, 0);

                    grandTaxable += monthlyTaxable;
                    grandCGST += monthlyCGST;
                    grandSGST += monthlySGST;
                    grandIGST += monthlyIGST;
                    grandQty += monthlyQty;

                    return `
                        <!-- ${month} Unified -->
                        ${combined.map((h, idx) => `
                            <tr class="hover:bg-slate-50/50 transition-all duration-300 group text-[11px]">
                                <td class="p-3 px-4 font-bold text-slate-900">
                                    ${idx === 0 ? `<span class="flex items-center gap-2"><span class="w-1 h-3 bg-slate-900 rounded-full"></span>${month}</span>` : ''}
                                </td>
                                <td class="p-3 px-4 text-center">
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${h.bgColor} ${h.color} border ${h.borderColor}">
                                        ${h.category}
                                    </span>
                                </td>
                                <td class="p-3 px-4 text-center">
                                    <span class="font-mono font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">${h.code}</span>
                                </td>
                                <td class="p-3 text-right font-bold text-slate-600">${h.count.toLocaleString('en-IN')}</td>
                                <td class="p-3 text-right font-black text-slate-700">₹${h.taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                <td class="p-3 text-right font-bold text-orange-600">₹${h.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                <td class="p-3 text-right font-bold text-blue-600">₹${h.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                <td class="p-3 text-right font-bold text-purple-600">₹${h.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                <td class="p-3 text-right px-4 font-black text-slate-900">₹${(h.taxable + h.cgst + h.sgst + h.igst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        `).join('')}
                        <tr class="bg-slate-50/50 font-black border-b border-slate-100/50 text-[10px]">
                            <td colspan="3" class="p-3 px-4 uppercase tracking-widest text-slate-400">${month} Sub-total</td>
                            <td class="p-3 text-right text-slate-900">${monthlyQty.toLocaleString('en-IN')}</td>
                            <td class="p-3 text-right text-slate-900">₹${monthlyTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td class="p-3 text-right text-orange-600/80">₹${monthlyCGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td class="p-3 text-right text-blue-600/80">₹${monthlySGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td class="p-3 text-right text-purple-600/80">₹${monthlyIGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td class="p-3 text-right px-4 text-slate-900">₹${(monthlyTaxable + monthlyCGST + monthlySGST + monthlyIGST).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                    `;
                }).join('');

                return `
                    <div class="glass p-1 overflow-hidden rounded-3xl border border-slate-100 shadow-sm bg-white/80 backdrop-blur-md">
                        <div class="overflow-x-auto">
                            <table class="w-full text-left">
                                <thead>
                                    <tr class="bg-slate-50/50 border-b border-slate-100 text-[9px]">
                                        <th class="p-3 px-4 font-black text-slate-400 uppercase tracking-widest w-32">Month</th>
                                        <th class="p-3 px-4 font-black text-slate-400 uppercase tracking-widest text-center">Category</th>
                                        <th class="p-3 px-4 font-black text-slate-400 uppercase tracking-widest text-center">HSN/SAC</th>
                                        <th class="p-3 text-right font-black text-slate-400 uppercase tracking-widest">Qty</th>
                                        <th class="p-3 text-right font-black text-slate-400 uppercase tracking-widest">Taxable</th>
                                        <th class="p-3 text-right font-black text-slate-400 uppercase tracking-widest">CGST</th>
                                        <th class="p-3 text-right font-black text-slate-400 uppercase tracking-widest">SGST</th>
                                        <th class="p-3 text-right font-black text-slate-400 uppercase tracking-widest">IGST</th>
                                        <th class="p-3 text-right px-4 font-black text-slate-400 uppercase tracking-widest">Total</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-50">
                                    ${tableRows}
                                </tbody>
                                <tfoot class="bg-slate-900 text-white font-black">
                                    <tr class="text-[11px]">
                                        <td colspan="3" class="p-4 px-4 uppercase tracking-[0.2em]">Grand Total (FY ${state.fy})</td>
                                        <td class="p-4 text-right">${grandQty.toLocaleString('en-IN')}</td>
                                        <td class="p-4 text-right">₹${grandTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        <td class="p-4 text-right">₹${grandCGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        <td class="p-4 text-right">₹${grandSGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        <td class="p-4 text-right">₹${grandIGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        <td class="p-4 text-right px-4">₹${(grandTaxable + grandCGST + grandSGST + grandIGST).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                `;
            })()}
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
                        <button onclick="${type === 'quotations' ? 'ui.quotation_v2.activeId = null; ui.quotation_v2.activeStatus = null; ' : ''}ui.modal.open('${type === 'quotations' ? 'quotation-new' : type}')" class="bg-${config.color}-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-${config.color}-700 transition-all shadow-sm shadow-${config.color}-500/10">+ ${config.btn}</button>
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
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">CIN Number</label>
                                <input type="text" name="cin_no" class="form-input font-mono uppercase" value="${data.cin_no || ''}" placeholder="U72200TG2007PTC053444">
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
                        <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
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

                            <!-- Revenue Stamp -->
                            <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                                <label class="block cursor-pointer">
                                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Revenue Stamp</span>
                                    <div class="w-32 h-32 mx-auto bg-white rounded-lg shadow-sm flex items-center justify-center overflow-hidden mb-3 border border-slate-200">
                                        ${data.revenue_stamp ? `<img src="${data.revenue_stamp}" class="w-full h-full object-contain">` : `<span class="text-slate-300 text-xs">No Stamp</span>`}
                                    </div>
                                    <input type="file" name="revenue_stamp" accept="image/*" class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
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
            now.setHours(0, 0, 0, 0); // Start of today for comparison

            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

            const searchQuery = (ui.licenses.searchQuery || '').toLowerCase();

            // Apply Filters and Search
            let filteredItems = items.filter(i => {
                const matchCategory = !filters.category || i.category === filters.category;
                const matchType = !filters.type || i.type === filters.type;

                // Refined Status Logic: "Expiring Soon" shows expiring this month
                let matchStatus = !filters.status || i.status === filters.status;
                if (filters.status === 'Expiring Soon') {
                    const ed = new Date(i.end_date);
                    matchStatus = ed >= now && ed <= endOfMonth;
                }

                const matchSearch = !searchQuery ||
                    (i.software_name || '').toLowerCase().includes(searchQuery) ||
                    (i.serial_number || '').toLowerCase().includes(searchQuery) ||
                    (i.customers?.name || '').toLowerCase().includes(searchQuery);

                return matchCategory && matchType && matchStatus && matchSearch;
            });

            const active = items.filter(i => i.status === 'Active');
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
                        <select onchange="ui.licenses.filter('status', this.value)" class="bg-white border text-[10px] font-black uppercase tracking-widest rounded-lg px-3 py-1.5 outline-none">
                            <option value="">All Statuses</option>
                            <option value="Active" ${filters.status === 'Active' ? 'selected' : ''}>Active</option>
                            <option value="Expired" ${filters.status === 'Expired' ? 'selected' : ''}>Expired</option>
                            <option value="Expiring Soon" ${filters.status === 'Expiring Soon' ? 'selected' : ''}>Expiring Soon</option>
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
                            <div class="customer-search-container">
                                <input type="text" id="lic-customer-search" 
                                       class="form-input" 
                                       placeholder="Type customer name..."
                                       oninput="ui.licenses.filterCustomers(this.value)"
                                       autocomplete="off"
                                       value="${data.customer_name || ''}">
                                <input type="hidden" name="customer_id" id="lic-customer-id" value="${data.customer_id || ''}" required>
                                <div id="lic-customer-results" class="customer-results-list hidden"></div>
                            </div>
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

            // Trigger View Transition
            if (el.viewContainer) {
                el.viewContainer.classList.remove('view-enter');
                void el.viewContainer.offsetWidth; // Trigger reflow
                el.viewContainer.classList.add('view-enter');
            }

            // Sync Financial Year dropdown
            if (el.fySelect) el.fySelect.value = state.fy;

            // Update Title & Navigation
            const titles = {
                dashboard: 'Financial Overview',
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
                reports: 'GST Filing Reports',
                settings: 'System Settings'
            };
            el.viewTitle.textContent = titles[state.view] || 'License Management';

            document.querySelectorAll('.nav-link').forEach(link => {
                if (link.getAttribute('href') === '#' + state.view) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
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
                    // Initialize charts after rendering
                    ui.dashboard.initCharts();
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
                    el.viewContainer.innerHTML = Templates.Customers(customers);
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
        utils: {
            getAvatarStyle: (name) => {
                if (!name) return '';
                const colors = [
                    { bg: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', text: '#fff' },
                    { bg: 'linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)', text: '#fff' },
                    { bg: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', text: '#fff' },
                    { bg: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', text: '#fff' },
                    { bg: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', text: '#fff' },
                    { bg: 'linear-gradient(135deg, #f97316 0%, #facc15 100%)', text: '#fff' },
                ];
                let hash = 0;
                for (let i = 0; i < name.length; i++) {
                    hash = name.charCodeAt(i) + ((hash << 5) - hash);
                }
                const index = Math.abs(hash) % colors.length;
                const style = colors[index];
                return `background: ${style.bg}; color: ${style.text}; border: none; font-weight: 700; text-shadow: 0 1px 2px rgba(0,0,0,0.1);`;
            }
        },
        dashboard: {
            initCharts: () => {
                const ctx = document.getElementById('revenueTrendChart');
                if (!ctx) return;

                const inrValues = [];
                const usdValues = [];
                const labels = [];

                let startYear;
                try {
                    const [sy, ey] = state.fy.split('-');
                    startYear = parseInt(sy);
                    if (startYear < 100) startYear += 2000;
                } catch (e) {
                    startYear = new Date().getFullYear();
                }

                const fyMonths = [
                    { m: 3, y: startYear }, { m: 4, y: startYear }, { m: 5, y: startYear },
                    { m: 6, y: startYear }, { m: 7, y: startYear }, { m: 8, y: startYear },
                    { m: 9, y: startYear }, { m: 10, y: startYear }, { m: 11, y: startYear },
                    { m: 0, y: startYear + 1 }, { m: 1, y: startYear + 1 }, { m: 2, y: startYear + 1 }
                ];

                fyMonths.forEach(slot => {
                    const d = new Date(slot.y, slot.m, 1);
                    const monthLabel = d.toLocaleString('default', { month: 'short' });
                    labels.push(monthLabel);

                    const monthInvoices = state.invoices.filter(inv => {
                        const invDate = new Date(inv.date);
                        return invDate.getMonth() === slot.m && invDate.getFullYear() === slot.y;
                    });

                    const inrTotal = monthInvoices
                        .filter(inv => (inv.currency || 'INR') === 'INR')
                        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

                    const usdTotal = monthInvoices
                        .filter(inv => inv.currency === 'USD')
                        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

                    inrValues.push(inrTotal);
                    usdValues.push(usdTotal);
                });

                if (window.Chart) {
                    new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: labels,
                            datasets: [
                                {
                                    label: 'INR Revenue (₹)',
                                    data: inrValues,
                                    borderColor: '#3b82f6',
                                    backgroundColor: (() => {
                                        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
                                        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
                                        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
                                        return gradient;
                                    })(),
                                    borderWidth: 3,
                                    fill: true,
                                    tension: 0.4,
                                    pointBackgroundColor: '#3b82f6',
                                    pointBorderColor: '#fff',
                                    pointBorderWidth: 2,
                                    pointRadius: 4,
                                    pointHoverRadius: 6
                                },
                                {
                                    label: 'USD Revenue ($)',
                                    data: usdValues,
                                    borderColor: '#10b981',
                                    backgroundColor: (() => {
                                        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
                                        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
                                        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
                                        return gradient;
                                    })(),
                                    borderWidth: 3,
                                    fill: true,
                                    tension: 0.4,
                                    pointBackgroundColor: '#10b981',
                                    pointBorderColor: '#fff',
                                    pointBorderWidth: 2,
                                    pointRadius: 4,
                                    pointHoverRadius: 6
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    display: true,
                                    position: 'top',
                                    align: 'end',
                                    labels: {
                                        boxWidth: 8,
                                        usePointStyle: true,
                                        font: { family: 'Poppins', size: 10, weight: '600' }
                                    }
                                },
                                tooltip: {
                                    backgroundColor: '#1e293b',
                                    titleFont: { family: 'Poppins', size: 12 },
                                    bodyFont: { family: 'Poppins', size: 12 },
                                    padding: 12,
                                    displayColors: true,
                                    callbacks: {
                                        label: (context) => {
                                            const label = context.dataset.label || '';
                                            const value = context.raw || 0;
                                            const prefix = label.includes('USD') ? '$' : '₹';
                                            return `${label}: ${prefix}${value.toLocaleString()}`;
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false },
                                    ticks: {
                                        font: { family: 'Poppins', size: 10 },
                                        callback: (value) => value >= 1000 ? (value / 1000) + 'k' : value
                                    }
                                },
                                x: {
                                    grid: { display: false, drawBorder: false },
                                    ticks: { font: { family: 'Poppins', size: 10 } }
                                }
                            }
                        }
                    });
                }


            },

        },
        customers: {
            searchQuery: '',
            search: (query) => {
                ui.customers.searchQuery = query;
                render();
            }
        },
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
                div.className = 'cf-contact-row';
                div.id = `contact-${id}`;
                div.innerHTML = `
                    <div>
                        <label class="cf-label">Name</label>
                        <input type="text" name="extra_contact_name_${id}" class="form-input" placeholder="Name">
                    </div>
                    <div>
                        <label class="cf-label">Department</label>
                        <input type="text" name="extra_contact_dept_${id}" class="form-input" placeholder="Dept">
                    </div>
                    <div>
                        <label class="cf-label">Mobile</label>
                        <input type="tel" name="extra_contact_mobile_${id}" class="form-input" placeholder="Mobile">
                    </div>
                    <div>
                        <label class="cf-label">Email</label>
                        <input type="email" name="extra_contact_email_${id}" class="form-input" placeholder="Email">
                    </div>
                    <div>
                        <label class="cf-label">Designation</label>
                        <input type="text" name="extra_contact_role_${id}" class="form-input" placeholder="Role">
                    </div>
                    <button type="button" onclick="ui.customer.removeContact('${id}')" class="cf-remove-contact" title="Remove person">×</button>
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
                            dept: data[`extra_contact_dept_${id}`],
                            mobile: data[`extra_contact_mobile_${id}`],
                            email: data[`extra_contact_email_${id}`],
                            role: data[`extra_contact_role_${id}`]
                        });
                    }
                    // Clean up temp fields
                    delete data[`extra_contact_name_${id}`];
                    delete data[`extra_contact_dept_${id}`];
                    delete data[`extra_contact_mobile_${id}`];
                    delete data[`extra_contact_email_${id}`];
                    delete data[`extra_contact_role_${id}`];
                });

                // Workaround for missing columns (contact_dept, contact_role, etc.): Store primary contact details in contacts array
                const primaryFields = ['contact_dept', 'contact_role', 'contact_mobile', 'contact_email', 'contact_phone'];
                const primaryData = { is_primary: true, name: data.contact_name };
                let hasPrimaryData = !!data.contact_name; // Fix: True if name exists

                primaryFields.forEach(field => {
                    if (data[field]) {
                        primaryData[field.replace('contact_', '')] = data[field];
                        hasPrimaryData = true;
                    }
                    delete data[field];
                });

                // Also delete contact_name from top-level to store in JSONB if we want consistency, 
                // but let's keep it if it's a valid column. 
                // Based on previous fixes, we should probably move it to JSONB too for safety.
                delete data.contact_name;

                if (hasPrimaryData) {
                    contacts.unshift(primaryData);
                }

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




                if (type === 'customer') {
                    root.innerHTML = `
                        <div class="cf-modal">
                            <!-- Header -->
                            <div class="cf-header">
                                <div class="cf-header-left">
                                    <div class="cf-header-icon">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                                    </div>
                                    <div>
                                        <div class="cf-header-title">Add Contact / Customer</div>
                                        <div class="cf-header-subtitle">Fill in the details below to create a new contact record</div>
                                    </div>
                                </div>
                                <button type="button" onclick="ui.modal.close()" class="cf-close-btn">
                                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                                </button>
                            </div>

                            <!-- Form -->
                            <form id="customer-form">
                                <input type="hidden" name="id" id="field-id">

                                <div class="cf-body">
                                    <!-- Section 1: Company Details -->
                                    <div class="cf-section accent-blue">
                                        <div class="cf-section-header">
                                            <div class="cf-section-icon blue">
                                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                                            </div>
                                            <span class="cf-section-title">Company Details</span>
                                        </div>
                                        <div class="cf-grid-full" style="margin-bottom: 0.875rem;">
                                            <div>
                                                <label class="cf-label">Company Name <span class="required">*</span></label>
                                                <input type="text" name="name" class="form-input" required placeholder="Enter company or individual name" oninput="ui.customer.updateShippingTitle()">
                                            </div>
                                        </div>
                                        <div class="cf-grid-2">
                                            <div>
                                                <label class="cf-label">GSTIN</label>
                                                <input type="text" name="gstin" class="form-input" placeholder="e.g. 27AABCU9603R1ZM">
                                            </div>
                                            <div>
                                                <label class="cf-label">PAN Number</label>
                                                <input type="text" name="pan_no" class="form-input" placeholder="e.g. AABCU9603R">
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Section 2: Primary Contact -->
                                    <div class="cf-section accent-emerald">
                                        <div class="cf-section-header">
                                            <div class="cf-section-icon emerald">
                                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                            </div>
                                            <span class="cf-section-title">Primary Contact Person</span>
                                        </div>
                                        <div class="cf-grid-3" style="margin-bottom: 0.875rem;">
                                            <div>
                                                <label class="cf-label">Name</label>
                                                <input type="text" name="contact_name" class="form-input" placeholder="Contact name">
                                            </div>
                                            <div>
                                                <label class="cf-label">Department</label>
                                                <input type="text" name="contact_dept" class="form-input" placeholder="e.g. Procurement">
                                            </div>
                                            <div>
                                                <label class="cf-label">Designation</label>
                                                <input type="text" name="contact_role" class="form-input" placeholder="e.g. Manager">
                                            </div>
                                        </div>
                                        <div class="cf-grid-3">
                                            <div>
                                                <label class="cf-label">Mobile No</label>
                                                <input type="tel" name="contact_mobile" class="form-input" placeholder="+91 XXXXX XXXXX">
                                            </div>
                                            <div>
                                                <label class="cf-label">Phone No</label>
                                                <input type="tel" name="contact_phone" class="form-input" placeholder="Landline">
                                            </div>
                                            <div>
                                                <label class="cf-label">Email</label>
                                                <input type="email" name="contact_email" class="form-input" placeholder="email@company.com">
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Section 3: Additional Contacts -->
                                    <div class="cf-section accent-purple">
                                        <div class="cf-section-header" style="margin-bottom: 0.75rem;">
                                            <div class="cf-section-icon purple">
                                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                                            </div>
                                            <span class="cf-section-title" style="flex:1;">Additional Contacts</span>
                                            <button type="button" onclick="ui.customer.addContact()" class="cf-add-btn">
                                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                                                Add Person
                                            </button>
                                        </div>
                                        <div id="additional-contacts-list" style="display: flex; flex-direction: column; gap: 0.5rem;">
                                            <!-- Dynamic Rows -->
                                        </div>
                                    </div>

                                    <!-- Section 4: Addresses -->
                                    <div class="cf-section accent-orange">
                                        <div class="cf-section-header">
                                            <div class="cf-section-icon orange">
                                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                            </div>
                                            <span class="cf-section-title">Addresses</span>
                                        </div>
                                        <div class="cf-address-grid">
                                            <!-- Billing Address -->
                                            <div class="cf-address-card">
                                                <div class="cf-address-card-header">
                                                    <span class="cf-address-card-title">Billing Address</span>
                                                </div>
                                                <div>
                                                    <label class="cf-label">Country</label>
                                                    <select name="billing_country" class="form-input">
                                                        ${Constants.Countries.map(c => `<option value="${c}" ${c === 'India' ? 'selected' : ''}>${c}</option>`).join('')}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label class="cf-label">Address Line 1 <span class="required">*</span></label>
                                                    <input type="text" name="billing_address1" class="form-input" required placeholder="Street, Building">
                                                </div>
                                                <div>
                                                    <label class="cf-label">Address Line 2</label>
                                                    <input type="text" name="billing_address2" class="form-input" placeholder="Area, Landmark">
                                                </div>
                                                <div class="cf-inline-2">
                                                    <div>
                                                        <label class="cf-label">City</label>
                                                        <input type="text" name="billing_city" class="form-input">
                                                    </div>
                                                    <div>
                                                        <label class="cf-label">Pincode</label>
                                                        <input type="text" name="billing_pincode" class="form-input">
                                                    </div>
                                                </div>
                                                <div>
                                                    <label class="cf-label">State</label>
                                                    <select name="state" class="form-input">
                                                        <option value="">Select State...</option>
                                                        ${Constants.States.map(s => `<option value="${s.code}">${s.name}</option>`).join('')}
                                                    </select>
                                                </div>
                                            </div>

                                            <!-- Shipping Address -->
                                            <div class="cf-address-card">
                                                <div class="cf-address-card-header">
                                                    <span class="cf-address-card-title">Shipping Address</span>
                                                    <label class="cf-same-billing">
                                                        <input type="checkbox" id="same-as-billing" onchange="ui.customer.copyBilling()">
                                                        Same as Billing
                                                    </label>
                                                </div>
                                                <div>
                                                    <label class="cf-label">Title</label>
                                                    <input type="text" name="shipping_title" class="form-input" style="background:#f8fafc;" placeholder="Auto-filled from Company Name">
                                                </div>
                                                <div>
                                                    <label class="cf-label">Country</label>
                                                    <select name="shipping_country" class="form-input">
                                                        ${Constants.Countries.map(c => `<option value="${c}" ${c === 'India' ? 'selected' : ''}>${c}</option>`).join('')}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label class="cf-label">Address Line 1 <span class="required">*</span></label>
                                                    <input type="text" name="shipping_address1" class="form-input" required placeholder="Street, Building">
                                                </div>
                                                <div>
                                                    <label class="cf-label">Address Line 2</label>
                                                    <input type="text" name="shipping_address2" class="form-input" placeholder="Area, Landmark">
                                                </div>
                                                <div class="cf-inline-2">
                                                    <div>
                                                        <label class="cf-label">City</label>
                                                        <input type="text" name="shipping_city" class="form-input">
                                                    </div>
                                                    <div>
                                                        <label class="cf-label">Pincode</label>
                                                        <input type="text" name="shipping_pincode" class="form-input">
                                                    </div>
                                                </div>
                                                <div>
                                                    <label class="cf-label">State</label>
                                                    <select name="shipping_state" class="form-input">
                                                        <option value="">Select State...</option>
                                                        ${Constants.States.map(s => `<option value="${s.code}">${s.name}</option>`).join('')}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Footer -->
                                <div class="cf-footer">
                                    <button type="button" onclick="ui.modal.close()" class="cf-btn-cancel">Cancel</button>
                                    <button type="submit" class="cf-btn-save">Save Contact</button>
                                </div>
                            </form>
                        </div>
    `;
                    document.getElementById('customer-form').onsubmit = e => ui.customer.save(e);
                } else if (type === 'customer-view') {
                    // Start Customer View Modal
                    // data is passed as the second argument to open(type, data)
                    const c = data || {};
                    const primaryContact = c.contacts && Array.isArray(c.contacts) ? c.contacts.find(con => con.is_primary) : null;

                    const billingState = Constants.States.find(s => s.code === c.state)?.name || c.state || '-';
                    const shippingState = Constants.States.find(s => s.code === c.shipping_state)?.name || c.shipping_state || '-';

                    // --- Calculate 360 Stats ---
                    const custQuotes = state.quotations.filter(q => q.customer_id === c.id);
                    const custProformas = state.proforma.filter(p => p.customer_id === c.id);
                    const custInvoices = state.invoices.filter(i => i.customer_id === c.id);

                    const totalRevenue = custInvoices.reduce((sum, i) => sum + (parseFloat(i.total_amount) || 0), 0);
                    const outstanding = custInvoices
                        .filter(i => i.status !== 'Paid' && i.status !== 'Closed')
                        .reduce((sum, i) => sum + (parseFloat(i.total_amount) || 0), 0);
                    const deductions = custInvoices.reduce((sum, i) => sum + (parseFloat(i.bank_charges) || 0), 0);

                    const symbol = '₹'; 
                    // ---------------------------

                    const contactsList = c.contacts && Array.isArray(c.contacts) ? c.contacts.filter(con => !con.is_primary).map(contact => `
                        <div class="cv-contact-card">
                            <div class="cv-contact-header">
                                <div class="cv-contact-avatar">
                                    ${contact.name ? contact.name.substring(0, 1).toUpperCase() : '?'}
                                </div>
                                <div class="cv-contact-info">
                                    <h5>${contact.name}</h5>
                                    <p>${contact.role || 'No Role'} • ${contact.dept || 'No Dept'}</p>
                                </div>
                            </div>
                            <div class="cv-contact-details">
                                ${contact.mobile ? `
                                <a href="tel:${contact.mobile}" class="cv-contact-link">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a2 2 0 011.917 1.285l1.257 3.771a2 2 0 01-1.917 2.715H9.196a11.722 11.722 0 005.093 5.093v-1.114a2 2 0 012.715-1.917l3.771 1.257c.54.18.917.684.917 1.257V21a2 2 0 01-2 2h-1c-10.493 0-19-8.507-19-19V5z"/></svg>
                                    ${contact.mobile}
                                </a>` : ''}
                                ${contact.email ? `
                                <a href="mailto:${contact.email}" class="cv-contact-link">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                                    ${contact.email}
                                </a>` : ''}
                            </div>
                        </div>
                    `).join('') : '<div class="cf-contacts-empty text-slate-400 italic text-sm">No additional contacts.</div>';

                    root.innerHTML = `
                        <div class="cf-modal">
                            <!-- Header -->
                            <div class="cv-header">
                                <div class="cv-header-left">
                                    <div class="cv-avatar">
                                        ${c.name ? c.name.substring(0, 2).toUpperCase() : '??'}
                                    </div>
                                    <div class="cv-header-info">
                                        <h2>${c.name}</h2>
                                        <div class="cv-badge-group">
                                            <span class="cv-badge">GSTIN: <b>${c.gstin || 'N/A'}</b></span>
                                            <span class="cv-badge">PAN: <b>${c.pan_no || 'N/A'}</b></span>
                                        </div>
                                    </div>
                                </div>
                                <button type="button" onclick="ui.modal.close()" class="cf-close-btn">
                                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                                </button>
                            </div>

                            <div class="cf-body">
                                <!-- Customer 360 Overview -->
                                <div class="cv-stats-grid">
                                    <div class="cv-stat-card blue">
                                        <div class="cv-stat-icon">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>
                                        </div>
                                        <span class="cv-stat-label">Quotations</span>
                                        <span class="cv-stat-value">${custQuotes.length}</span>
                                    </div>
                                    <div class="cv-stat-card violet">
                                        <div class="cv-stat-icon">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                        </div>
                                        <span class="cv-stat-label">Proforma</span>
                                        <span class="cv-stat-value">${custProformas.length}</span>
                                    </div>
                                    <div class="cv-stat-card emerald">
                                        <div class="cv-stat-icon">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                        </div>
                                        <span class="cv-stat-label">Invoices</span>
                                        <span class="cv-stat-value">${custInvoices.length}</span>
                                    </div>
                                    <div class="cv-stat-card blue">
                                        <div class="cv-stat-icon">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                        </div>
                                        <span class="cv-stat-label">Total Revenue</span>
                                        <span class="cv-stat-value">${symbol}${totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                    </div>
                                    <div class="cv-stat-card rose">
                                        <div class="cv-stat-icon">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                        </div>
                                        <span class="cv-stat-label">Outstanding</span>
                                        <span class="cv-stat-value">${symbol}${outstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                    </div>
                                    <div class="cv-stat-card amber">
                                        <div class="cv-stat-icon">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                                        </div>
                                        <span class="cv-stat-label">Deductions</span>
                                        <span class="cv-stat-value">${symbol}${deductions.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                    </div>
                                </div>

                                <div class="grid grid-cols-3 gap-6">
                                    <!-- Main Details -->
                                    <div class="col-span-2 space-y-6">
                                        <!-- Section 1: Business Overview -->
                                        <div class="cf-section accent-blue">
                                            <div class="cf-section-header">
                                                <div class="cf-section-icon blue">
                                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                                                </div>
                                                <span class="cf-section-title">Business Overview</span>
                                            </div>
                                            <div class="cv-data-grid">
                                                <div class="cv-data-item">
                                                    <span class="cv-data-label">Company Name</span>
                                                    <span class="cv-data-value">${c.name}</span>
                                                </div>
                                                <div class="cv-data-item">
                                                    <span class="cv-data-label">GSTIN</span>
                                                    <span class="cv-data-value">${c.gstin || 'Not Provided'}</span>
                                                </div>
                                                <div class="cv-data-item">
                                                    <span class="cv-data-label">PAN Number</span>
                                                    <span class="cv-data-value">${c.pan_no || 'Not Provided'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Section 2: Primary Contact -->
                                        <div class="cf-section accent-emerald">
                                            <div class="cf-section-header">
                                                <div class="cf-section-icon emerald">
                                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                                                </div>
                                                <span class="cf-section-title">Primary Contact Person</span>
                                            </div>
                                            <div class="cv-data-grid" style="grid-template-columns: repeat(3, 1fr);">
                                                <div class="cv-data-item">
                                                    <span class="cv-data-label">Name</span>
                                                    <span class="cv-data-value">${c.contact_name || '-'}</span>
                                                </div>
                                                <div class="cv-data-item">
                                                    <span class="cv-data-label">Role</span>
                                                    <span class="cv-data-value">${c.contact_role || primaryContact?.role || '-'}</span>
                                                </div>
                                                <div class="cv-data-item">
                                                    <span class="cv-data-label">Department</span>
                                                    <span class="cv-data-value">${c.contact_dept || primaryContact?.dept || '-'}</span>
                                                </div>
                                                <div class="cv-data-item">
                                                    <span class="cv-data-label">Mobile</span>
                                                    <span class="cv-data-value">${c.contact_mobile || primaryContact?.mobile || '-'}</span>
                                                </div>
                                                <div class="cv-data-item">
                                                    <span class="cv-data-label">Email</span>
                                                    <span class="cv-data-value">${c.contact_email || primaryContact?.email || '-'}</span>
                                                </div>
                                                <div class="cv-data-item">
                                                    <span class="cv-data-label">Phone</span>
                                                    <span class="cv-data-value">${c.contact_phone || primaryContact?.phone || '-'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Section 3: Addresses -->
                                        <div class="cf-section accent-orange">
                                            <div class="cf-section-header">
                                                <div class="cf-section-icon orange">
                                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                                </div>
                                                <span class="cf-section-title">Addresses</span>
                                            </div>
                                            <div class="cf-address-grid">
                                                <div class="cf-address-card">
                                                    <div class="cf-address-card-header">
                                                        <span class="cf-address-card-title">Billing Address</span>
                                                    </div>
                                                    <div class="text-sm leading-relaxed text-slate-600">
                                                        <div class="font-bold text-slate-900 mb-1">${c.name}</div>
                                                        ${c.billing_address1 || ''}<br>
                                                        ${c.billing_address2 ? c.billing_address2 + '<br>' : ''}
                                                        ${c.billing_city} - ${c.billing_pincode}<br>
                                                        ${billingState}, ${c.billing_country || 'India'}
                                                    </div>
                                                </div>
                                                <div class="cf-address-card">
                                                    <div class="cf-address-card-header">
                                                        <span class="cf-address-card-title">Shipping Address</span>
                                                    </div>
                                                    <div class="text-sm leading-relaxed text-slate-600">
                                                        <div class="font-bold text-slate-900 mb-1">${c.shipping_title || c.name}</div>
                                                        ${c.shipping_address1 || ''}<br>
                                                        ${c.shipping_address2 ? c.shipping_address2 + '<br>' : ''}
                                                        ${c.shipping_city} - ${c.shipping_pincode}<br>
                                                        ${shippingState}, ${c.shipping_country || 'India'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Sidebar: Team -->
                                    <div class="space-y-6">
                                        <div class="cf-section accent-purple" style="height: 100%;">
                                            <div class="cf-section-header">
                                                <div class="cf-section-icon purple">
                                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                                                </div>
                                                <span class="cf-section-title">Team Members</span>
                                            </div>
                                            <div class="space-y-4 pt-2">
                                                ${contactsList}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Footer -->
                            <div class="cf-footer">
                                <button type="button" onclick="ui.customer.delete('${c.id}')" class="cv-btn-delete">Delete Customer</button>
                                <div style="flex:1;"></div>
                                <button type="button" onclick="ui.modal.close()" class="cf-btn-cancel">Close</button>
                                <button type="button" onclick="ui.modal.edit('customer', '${c.id}')" class="cv-btn-edit">Edit Details</button>
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
                                <div class="customer-search-container relative">
                                    <input type="text" id="inv-customer-search" 
                                           class="w-full text-lg font-black bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-300" 
                                           placeholder="Type customer name..." 
                                           oninput="ui.invoice.filterCustomers(this.value)"
                                           autocomplete="off">
                                    <input type="hidden" id="inv-customer">
                                    <div id="inv-customer-results" class="customer-results-list hidden"></div>
                                    
                                    <!-- Contact picker popup (appears after customer is selected) -->
                                    <div id="inv-contact-picker" class="hidden absolute top-full left-0 right-0 z-[110] mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden" style="max-height:220px;overflow-y:auto;">
                                        <div class="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Contact Person</span>
                                            <button type="button" onclick="document.getElementById('inv-contact-picker').classList.add('hidden')" class="text-slate-400 hover:text-slate-600 text-xs leading-none">&times;</button>
                                        </div>
                                        <div id="inv-contact-list" class="divide-y divide-slate-50"></div>
                                    </div>
                                </div>
                                <!-- Hidden inputs to store selected contact -->
                                <input type="hidden" id="inv-contact-name">
                                <input type="hidden" id="inv-contact-role">
                                <input type="hidden" id="inv-contact-dept">
                                
                                <!-- Selected contact chip -->
                                <div id="inv-contact-chip" class="hidden mt-2 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5 hover:bg-blue-100 transition-colors cursor-default">
                                    <svg class="w-3 h-3 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                    <span id="inv-contact-label" class="text-[10px] font-bold text-blue-700 flex-1 truncate"></span>
                                    <button type="button" onclick="ui.invoice.clearContact()" class="text-blue-300 hover:text-blue-600 text-xs leading-none ml-1">&times;</button>
                                </div>
                                <div class="mt-3 flex gap-4">
                                    <button onclick="ui.modal.open('customer')" class="text-xs font-bold text-accent">+ Create Customer</button>
                                </div>
                            </div>
                            
                            <div class="col-span-12 lg:col-span-9 flex border-l border-slate-100 pl-8 gap-8">
                                <div class="builder-header-field flex-1">
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Invoice #</label>
                                    <div class="flex items-center gap-2">
                                        <input type="text" id="inv-no" class="text-sm font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0 w-52" readonly>
                                        <button type="button" onclick="ui.invoice.unlockNumber()" class="p-1 px-2 rounded bg-slate-100 text-[9px] font-bold text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all uppercase tracking-widest" title="Manual Override">
                                            Unlock
                                        </button>
                                        <input type="date" id="inv-date" value="${today}" class="text-sm font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:ring-0 ml-4" placeholder="Invoice Date">
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
                                    <select id="inv-payment-terms" class="form-input text-sm font-bold bg-slate-50 border-slate-200 rounded-lg w-full">
                                        <option value="">Select Payment Terms</option>
                                        <option value="100% Advance">100% Advance</option>
                                        <option value="100% Within 7 Days">100% Within 7 Days</option>
                                        <option value="100% Within 10 Days">100% Within 10 Days</option>
                                        <option value="100% Within 15 Days">100% Within 15 Days</option>
                                        <option value="100% Within 30 Days">100% Within 30 Days</option>
                                        <option value="100% Within 45 Days">100% Within 45 Days</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Delivery Time</label>
                                    <select id="inv-delivery-time" class="form-input text-sm font-bold bg-slate-50 border-slate-200 rounded-lg w-full">
                                        <option value="">Select Delivery Time</option>
                                        <option value="Within 2 Working Days">Within 2 Working Days</option>
                                        <option value="Within 3 Working Days">Within 3 Working Days</option>
                                        <option value="Within 7 Working Days">Within 7 Working Days</option>
                                        <option value="Within 10 Working Days">Within 10 Working Days</option>
                                        <option value="Within 30 Working Days">Within 30 Working Days</option>
                                        <option value="Within 45 Working Days">Within 45 Working Days</option>
                                        <option value="Within 60 Working Days">Within 60 Working Days</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Delivery Mode</label>
                                    <select id="inv-delivery-mode" class="form-input text-sm font-bold bg-slate-50 border-slate-200 rounded-lg w-full">
                                        <option value="">Select Delivery Mode</option>
                                        <option value="By Email (No Physical Supply)">By Email (No Physical Supply)</option>
                                        <option value="By Courier">By Courier</option>
                                        <option value="In Person">In Person</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Section 2.8: Receipts & Deductions (For Payments) -->
                        <div class="builder-section bg-blue-50/20 py-6 border-b-2 border-blue-100">
                            <div class="grid grid-cols-12 gap-8">
                                <div class="col-span-12">
                                    <h4 class="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Post-Payment Deductions (TDS / Charges)</h4>
                                    <div class="grid grid-cols-4 gap-4">
                                        <div>
                                            <label class="text-[10px] font-bold text-slate-400 block mb-1">TDS Amount</label>
                                            <input type="number" id="inv-tds" step="0.01" value="0.00" class="form-input text-sm font-bold bg-white border-slate-200 rounded-lg w-full">
                                        </div>
                                        <div>
                                            <label class="text-[10px] font-bold text-slate-400 block mb-1">Bank Charges</label>
                                            <input type="number" id="inv-bank-deduction" step="0.01" value="0.00" class="form-input text-sm font-bold bg-white border-slate-200 rounded-lg w-full">
                                        </div>
                                        <div>
                                            <label class="text-[10px] font-bold text-slate-400 block mb-1">PBG Amount</label>
                                            <input type="number" id="inv-pbg" step="0.01" value="0.00" class="form-input text-sm font-bold bg-white border-slate-200 rounded-lg w-full">
                                        </div>
                                        <div>
                                            <label class="text-[10px] font-bold text-slate-400 block mb-1">Other Deductions</label>
                                            <input type="number" id="inv-other-deduction" step="0.01" value="0.00" class="form-input text-sm font-bold bg-white border-slate-200 rounded-lg w-full">
                                        </div>
                                    </div>
                                    <p class="mt-2 text-[9px] text-slate-400 italic font-medium">Note: These amounts are subtracted from the received total in the Customer Ledger.</p>
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
                    // Only initialize for new invoices
                    if (!ui.invoice.activeId) {
                        ui.invoice.updateDocNo(); 
                        ui.invoice.addItem();
                        ui.invoice.loadDefaultTerms();
                    }
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
                                 <div class="customer-search-container relative">
                                     <input type="text" id="qtn-customer-search" 
                                            class="w-full text-lg font-black bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-300" 
                                            placeholder="Type customer name..."
                                            oninput="ui.quotation_v2.filterCustomers(this.value)"
                                            autocomplete="off">
                                     <input type="hidden" id="qtn-customer">
                                     <div id="qtn-customer-results" class="customer-results-list hidden"></div>

                                     <!-- Contact picker popup -->
                                     <div id="qtn-contact-picker" class="hidden absolute top-full left-0 right-0 z-[110] mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden" style="max-height:220px;overflow-y:auto;">
                                         <div class="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                             <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Contact Person</span>
                                             <button type="button" onclick="document.getElementById('qtn-contact-picker').classList.add('hidden')" class="text-slate-400 hover:text-slate-600 text-xs leading-none">&times;</button>
                                         </div>
                                         <div id="qtn-contact-list" class="divide-y divide-slate-50"></div>
                                     </div>
                                 </div>
                                 <!-- Hidden inputs to store selected contact -->
                                 <input type="hidden" id="qtn-contact-name">
                                 <input type="hidden" id="qtn-contact-role">
                                 <input type="hidden" id="qtn-contact-dept">

                                 <!-- Selected contact chip -->
                                 <div id="qtn-contact-chip" class="hidden mt-2 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5 hover:bg-blue-100 transition-colors cursor-default">
                                     <svg class="w-3 h-3 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                     <span id="qtn-contact-label" class="text-[10px] font-bold text-blue-700 flex-1 truncate"></span>
                                     <button type="button" onclick="ui.quotation_v2.clearContact()" class="text-blue-300 hover:text-blue-600 text-xs leading-none ml-1">&times;</button>
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
                                    <select id="qtn-payment-terms" class="form-input text-sm font-bold bg-slate-50 border-slate-200 rounded-lg w-full">
                                        <option value="">Select Payment Terms</option>
                                        <option value="100% Advance">100% Advance</option>
                                        <option value="100% Within 7 Days">100% Within 7 Days</option>
                                        <option value="100% Within 10 Days">100% Within 10 Days</option>
                                        <option value="100% Within 15 Days">100% Within 15 Days</option>
                                        <option value="100% Within 30 Days">100% Within 30 Days</option>
                                        <option value="100% Within 45 Days">100% Within 45 Days</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Delivery Time</label>
                                    <select id="qtn-delivery-time" class="form-input text-sm font-bold bg-slate-50 border-slate-200 rounded-lg w-full">
                                        <option value="">Select Delivery Time</option>
                                        <option value="Within 2 Working Days">Within 2 Working Days</option>
                                        <option value="Within 3 Working Days">Within 3 Working Days</option>
                                        <option value="Within 7 Working Days">Within 7 Working Days</option>
                                        <option value="Within 10 Working Days">Within 10 Working Days</option>
                                        <option value="Within 30 Working Days">Within 30 Working Days</option>
                                        <option value="Within 45 Working Days">Within 45 Working Days</option>
                                        <option value="Within 60 Working Days">Within 60 Working Days</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Delivery Mode</label>
                                    <select id="qtn-delivery-mode" class="form-input text-sm font-bold bg-slate-50 border-slate-200 rounded-lg w-full">
                                        <option value="">Select Delivery Mode</option>
                                        <option value="By Email (No Physical Supply)">By Email (No Physical Supply)</option>
                                        <option value="By Courier">By Courier</option>
                                        <option value="In Person">In Person</option>
                                    </select>
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
                            ${ui.quotation_v2.activeId ? `<button onclick="ui.quotation_v2.save(false, false, true)" class="px-6 py-2 bg-purple-50 border border-purple-200 text-purple-600 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-purple-100 transition-all">Create Revision</button>` : ''}
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
                                    <select id="pfi-payment-terms" class="form-input text-sm font-bold bg-slate-50 border-slate-200 rounded-lg w-full">
                                        <option value="">Select Payment Terms</option>
                                        <option value="100% Advance">100% Advance</option>
                                        <option value="100% Within 7 Days">100% Within 7 Days</option>
                                        <option value="100% Within 10 Days">100% Within 10 Days</option>
                                        <option value="100% Within 15 Days">100% Within 15 Days</option>
                                        <option value="100% Within 30 Days">100% Within 30 Days</option>
                                        <option value="100% Within 45 Days">100% Within 45 Days</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Delivery Time</label>
                                    <select id="pfi-delivery-time" class="form-input text-sm font-bold bg-slate-50 border-slate-200 rounded-lg w-full">
                                        <option value="">Select Delivery Time</option>
                                        <option value="Within 2 Working Days">Within 2 Working Days</option>
                                        <option value="Within 3 Working Days">Within 3 Working Days</option>
                                        <option value="Within 7 Working Days">Within 7 Working Days</option>
                                        <option value="Within 10 Working Days">Within 10 Working Days</option>
                                        <option value="Within 30 Working Days">Within 30 Working Days</option>
                                        <option value="Within 45 Working Days">Within 45 Working Days</option>
                                        <option value="Within 60 Working Days">Within 60 Working Days</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Delivery Mode</label>
                                    <select id="pfi-delivery-mode" class="form-input text-sm font-bold bg-slate-50 border-slate-200 rounded-lg w-full">
                                        <option value="">Select Delivery Mode</option>
                                        <option value="By Email (No Physical Supply)">By Email (No Physical Supply)</option>
                                        <option value="By Courier">By Courier</option>
                                        <option value="In Person">In Person</option>
                                    </select>
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
                        gstr1.b2b.reduce((sum, inv) => sum + ((inv.subtotal + (inv.bank_charges || 0)) * (inv.exchange_rate || 1)), 0) +
                        gstr1.b2cl.reduce((sum, inv) => sum + ((inv.subtotal + (inv.bank_charges || 0)) * (inv.exchange_rate || 1)), 0) +
                        gstr1.b2cs.reduce((sum, entry) => sum + entry.taxable, 0) +
                        gstr1.exp.reduce((sum, inv) => sum + ((inv.subtotal + (inv.bank_charges || 0)) * (inv.exchange_rate || 1)), 0);

                    const totalTax =
                        gstr1.b2b.reduce((sum, inv) => sum + ((inv.total_amount - (inv.subtotal + (inv.bank_charges || 0))) * (inv.exchange_rate || 1)), 0) +
                        gstr1.b2cl.reduce((sum, inv) => sum + ((inv.total_amount - (inv.subtotal + (inv.bank_charges || 0))) * (inv.exchange_rate || 1)), 0) +
                        gstr1.b2cs.reduce((sum, entry) => sum + entry.igst + entry.cgst + entry.sgst, 0) +
                        gstr1.exp.reduce((sum, inv) => sum + ((inv.total_amount - (inv.subtotal + (inv.bank_charges || 0))) * (inv.exchange_rate || 1)), 0);

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

                    let contacts_html = '<option value="">Select Contact...</option>';
                    let customer_name = '';
                    if (licenseData.customer_id) {
                        const cust = state.customers.find(c => c.id === licenseData.customer_id);
                        if (cust) {
                            customer_name = cust.name;
                            if (cust.contacts) {
                                contacts_html += cust.contacts.map(c =>
                                    `<option value="${c.name}" ${licenseData.contact_person === c.name ? 'selected' : ''}>${c.name} (${c.role || 'No Role'})</option>`
                                ).join('');
                            }
                        }
                    }

                    root.innerHTML = Templates.LicenseForm({ ...licenseData, contacts_html, customer_name });

                    // Trigger status preview if end date exists
                    if (licenseData.end_date) {
                        ui.licenses.updatePreviewStatus(licenseData.end_date);
                    }
                }
            },
            close: () => {
                ui.invoice.activeId = null; // Clear invoice state
                ui.quotation_v2.activeId = null;
                ui.quotation_v2.activeStatus = null;
                document.getElementById('modal-overlay').classList.remove('active');
            },

            edit: (type, id) => {
                ui.modal.open(type);
                const table = 'customers';
                const item = state[table].find(i => i.id === id);
                if (item) {
                    const form = document.getElementById(`${type}-form`);
                    if (!form) return;

                    Object.keys(item).forEach(key => {
                        // Special handling for Additional Contacts
                        if (key === 'contacts' && Array.isArray(item[key])) {
                            // Clear existing if any (fresh form so likely empty, but good practice)
                            const container = document.getElementById('additional-contacts-list');
                            if (container) container.innerHTML = '';

                            item[key].forEach(contact => {
                                if (contact.is_primary) {
                                    // Populate primary contact fields if found in contacts JSONB
                                    const primaryFields = ['dept', 'role', 'mobile', 'email', 'phone'];
                                    primaryFields.forEach(f => {
                                        const field = form.elements[`contact_${f}`];
                                        if (field) field.value = contact[f] || '';
                                    });
                                    return; // Don't add to additional contacts
                                }
                                const rowId = ui.customer.addContact();
                                if (form.elements[`extra_contact_name_${rowId}`]) form.elements[`extra_contact_name_${rowId}`].value = contact.name || '';
                                if (form.elements[`extra_contact_dept_${rowId}`]) form.elements[`extra_contact_dept_${rowId}`].value = contact.dept || '';
                                if (form.elements[`extra_contact_mobile_${rowId}`]) form.elements[`extra_contact_mobile_${rowId}`].value = contact.mobile || '';
                                if (form.elements[`extra_contact_email_${rowId}`]) form.elements[`extra_contact_email_${rowId}`].value = contact.email || '';
                                if (form.elements[`extra_contact_role_${rowId}`]) form.elements[`extra_contact_role_${rowId}`].value = contact.role || '';
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
        spotlight: {
            isOpen: false,
            selectedIndex: -1,
            results: [],
            
            init: () => {
                const div = document.createElement('div');
                div.id = 'spotlight-overlay';
                div.className = 'spotlight-overlay';
                div.innerHTML = `
                    <div class="spotlight-modal">
                        <div class="spotlight-search-header">
                            <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                            <input type="text" id="spotlight-input" class="spotlight-input" placeholder="Search customers, invoices, quotes..." autocomplete="off">
                        </div>
                        <div id="spotlight-results" class="spotlight-results">
                            <div class="p-8 text-center text-slate-400 text-sm">Type something to search... (Ctrl+K)</div>
                        </div>
                        <div class="spotlight-footer">
                            <span><kbd class="spotlight-kbd">↑↓</kbd> to navigate</span>
                            <span><kbd class="spotlight-kbd">Enter</kbd> to open</span>
                            <span><kbd class="spotlight-kbd">Esc</kbd> to close</span>
                        </div>
                    </div>
                `;
                document.body.appendChild(div);

                const input = document.getElementById('spotlight-input');
                if (input) {
                    input.oninput = (e) => ui.spotlight.search(e.target.value);
                    input.onkeydown = (e) => ui.spotlight.handleKey(e);
                }
                div.onclick = (e) => { if(e.target === div) ui.spotlight.close(); };

                window.addEventListener('keydown', (e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                        e.preventDefault();
                        ui.spotlight.open();
                    }
                });
            },

            open: () => {
                const overlay = document.getElementById('spotlight-overlay');
                if (!overlay) return;
                overlay.classList.add('active');
                const input = document.getElementById('spotlight-input');
                if (input) {
                    input.value = '';
                    input.focus();
                }
                ui.spotlight.search('');
            },

            close: () => {
                const overlay = document.getElementById('spotlight-overlay');
                if (overlay) overlay.classList.remove('active');
            },

            search: (query) => {
                const resultsContainer = document.getElementById('spotlight-results');
                if (!resultsContainer) return;
                if (!query) {
                    resultsContainer.innerHTML = '<div class="p-8 text-center text-slate-400 text-sm">Search across Customers, Invoices, Quotations...</div>';
                    ui.spotlight.results = [];
                    return;
                }

                const q = query.toLowerCase();
                const results = {
                    customers: state.customers.filter(c => c.name.toLowerCase().includes(q) || (c.company && c.company.toLowerCase().includes(q)) || (c.gstin && c.gstin.toLowerCase().includes(q))).slice(0, 5),
                    invoices: state.invoices.filter(i => i.invoice_no.toLowerCase().includes(q) || state.customers.find(c => c.id === i.customer_id)?.name.toLowerCase().includes(q)).slice(0, 5),
                    quotations: state.quotations.filter(qtn => qtn.quotation_no.toLowerCase().includes(q) || qtn.subject?.toLowerCase().includes(q)).slice(0, 5),
                    proforma: state.proforma.filter(p => p.doc_no?.toLowerCase().includes(q) || state.customers.find(c => c.id === p.customer_id)?.name.toLowerCase().includes(q)).slice(0, 5)
                };

                let html = '';
                ui.spotlight.results = [];

                const addResult = (type, item, title, subtitle, icon) => {
                    const index = ui.spotlight.results.length;
                    ui.spotlight.results.push({ type, id: item.id, item });
                    return `
                        <div class="spotlight-item" data-index="${index}" onclick="ui.spotlight.navigate('${type}', '${item.id}')">
                            <div class="spotlight-item-icon">${icon}</div>
                            <div class="spotlight-item-info">
                                <div class="spotlight-item-title">${title}</div>
                                <div class="spotlight-item-subtitle">${subtitle}</div>
                            </div>
                        </div>
                    `;
                };

                if (results.customers.length > 0) {
                    html += '<div class="spotlight-category">Customers</div>';
                    results.customers.forEach(c => {
                        html += addResult('customer', c, c.name, `GSTIN: ${c.gstin || 'N/A'}`, '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>');
                    });
                }

                if (results.invoices.length > 0) {
                    html += '<div class="spotlight-category">Invoices</div>';
                    results.invoices.forEach(i => {
                        const c = state.customers.find(x => x.id === i.customer_id);
                        html += addResult('invoice', i, i.invoice_no, c ? c.name : 'Unknown Customer', '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>');
                    });
                }

                if (results.quotations.length > 0) {
                    html += '<div class="spotlight-category">Quotations</div>';
                    results.quotations.forEach(qtn => {
                        const c = state.customers.find(x => x.id === qtn.customer_id);
                        html += addResult('quotation', qtn, qtn.quotation_no, qtn.subject || (c ? c.name : ''), '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>');
                    });
                }

                if (results.proforma.length > 0) {
                    html += '<div class="spotlight-category">Proforma Invoices</div>';
                    results.proforma.forEach(p => {
                        const c = state.customers.find(x => x.id === p.customer_id);
                        html += addResult('proforma', p, p.doc_no || 'PFI', c ? c.name : '', '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>');
                    });
                }

                if (!html) html = `<div class="p-8 text-center text-slate-400 text-sm">No results found for "${query}"</div>`;
                resultsContainer.innerHTML = html;
                ui.spotlight.selectedIndex = -1;
            },

            handleKey: (e) => {
                if (e.key === 'Escape') ui.spotlight.close();
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    ui.spotlight.selectedIndex = Math.min(ui.spotlight.selectedIndex + 1, ui.spotlight.results.length - 1);
                    ui.spotlight.updateActive();
                }
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    ui.spotlight.selectedIndex = Math.max(ui.spotlight.selectedIndex - 1, 0);
                    ui.spotlight.updateActive();
                }
                if (e.key === 'Enter') {
                    const res = ui.spotlight.results[ui.spotlight.selectedIndex];
                    if (res) ui.spotlight.navigate(res.type, res.id);
                }
            },

            updateActive: () => {
                const items = document.querySelectorAll('.spotlight-item');
                items.forEach((it, i) => {
                    if (i === ui.spotlight.selectedIndex) {
                        it.classList.add('active');
                        it.scrollIntoView({ block: 'nearest' });
                    } else {
                        it.classList.remove('active');
                    }
                });
            },

            navigate: (type, id) => {
                ui.spotlight.close();
                if (type === 'customer') {
                    const c = state.customers.find(x => x.id === id);
                    if (c) ui.modal.open('customer-view', c);
                } else if (type === 'invoice') {
                    api.docs.generatePDF('invoices', id);
                } else if (type === 'quotation') {
                    api.docs.generatePDF('quotations', id);
                } else if (type === 'proforma') {
                    api.docs.generatePDF('proforma', id);
                }
            }
        },
        licenses: {
            filters: { category: '', type: '', status: '' },
            searchQuery: '',

            filterCustomers: (query) => {
                const results = document.getElementById('lic-customer-results');
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
                        <div class="customer-result-item" onclick="ui.licenses.selectCustomer('${c.id}', '${c.name.replace(/'/g, "\\'")}')">
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
                const searchInput = document.getElementById('lic-customer-search');
                const idInput = document.getElementById('lic-customer-id');
                if (searchInput) searchInput.value = name;
                if (idInput) idInput.value = id;
                document.getElementById('lic-customer-results').classList.add('hidden');
                ui.licenses.onCustomerChange(id);
            },

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
                now.setHours(0, 0, 0, 0);
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

                if (ed < now) {
                    badge.textContent = 'Expired';
                    badge.className = 'bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest';
                } else if (ed <= endOfMonth) {
                    badge.textContent = 'Expiring Soon';
                    badge.className = 'bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest';
                } else {
                    badge.textContent = 'Active';
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
                const content = document.getElementById(`dropdown-${id}`);
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
                    const { data: legacyItems } = await supabaseClient
                        .from('invoice_items')
                        .select('*, products(name, gst, hsn)')
                        .in('invoice_id', invIds);

                    const allItems = [];
                    if (legacyItems) allItems.push(...legacyItems.map(it => ({ ...it, _source: 'legacy' })));

                    filteredInvoices.forEach(inv => {
                        if (inv.metadata?.items && Array.isArray(inv.metadata.items)) {
                            inv.metadata.items.forEach(it => {
                                allItems.push({
                                    ...it,
                                    invoice_id: inv.id,
                                    hsn_code: it.hsn,
                                    product_name: it.product_name,
                                    _source: 'json'
                                });
                            });
                        }
                    });

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
                    if (allItems.length > 0) {
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
                                    desc: item.product_name || item.products?.name || 'Item',
                                    qty: 0,
                                    taxable: 0,
                                    igst: 0,
                                    cgst: 0,
                                    sgst: 0
                                };
                            }

                            const rowTaxable = (item.qty * item.rate * (1 - (item.discount || 0) / 100)) * exRate;
                            
                            let gstRate = 0;
                            if (inv.type === 'Regular') {
                                if (item._source === 'legacy') {
                                    gstRate = item.products?.gst || 0;
                                } else {
                                    // Use tax_rate from JSON metadata, fallback to 18
                                    gstRate = item.tax_rate !== undefined ? item.tax_rate : (item.gst !== undefined ? item.gst : 18);
                                }
                            }
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
                    // Aggregate B2CS by state and rate
                    const b2csAggregated = {};
                    b2cs.forEach(inv => {
                        const exRate = inv.exchange_rate || 1.0;
                        const taxable = (inv.subtotal + (inv.bank_charges || 0)) * exRate;
                        const tax = (inv.total_amount - taxable) * exRate;
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
                ws_data.push(['Total Taxable Value', data.b2b.reduce((sum, inv) => sum + ((inv.subtotal + (inv.bank_charges || 0)) * (inv.exchange_rate || 1)), 0) +
                    data.b2cl.reduce((sum, inv) => sum + ((inv.subtotal + (inv.bank_charges || 0)) * (inv.exchange_rate || 1)), 0) +
                    data.b2cs.reduce((sum, entry) => sum + entry.taxable, 0) +
                    data.exp.reduce((sum, inv) => sum + ((inv.subtotal + (inv.bank_charges || 0)) * (inv.exchange_rate || 1)), 0)]);
                ws_data.push(['Total Tax', data.b2b.reduce((sum, inv) => sum + ((inv.total_amount - (inv.subtotal + (inv.bank_charges || 0))) * (inv.exchange_rate || 1)), 0) +
                    data.b2cl.reduce((sum, inv) => sum + ((inv.total_amount - (inv.subtotal + (inv.bank_charges || 0))) * (inv.exchange_rate || 1)), 0) +
                    data.b2cs.reduce((sum, entry) => sum + entry.igst + entry.cgst + entry.sgst, 0) +
                    data.exp.reduce((sum, inv) => sum + ((inv.total_amount - (inv.subtotal + (inv.bank_charges || 0))) * (inv.exchange_rate || 1)), 0)]);
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
                    const taxable = (inv.subtotal + (inv.bank_charges || 0)) * exRate;
                    const tax = (inv.total_amount - taxable) * exRate;
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
                ws_data.push(['Total Taxable Value', data.b2b.reduce((sum, inv) => sum + ((inv.subtotal + (inv.bank_charges || 0)) * (inv.exchange_rate || 1)), 0)]);
                ws_data.push(['Total Tax', data.b2b.reduce((sum, inv) => sum + ((inv.total_amount - (inv.subtotal + (inv.bank_charges || 0))) * (inv.exchange_rate || 1)), 0)]);
                ws_data.push([]);
                ws_data.push([]);

                // ===== B2C Invoices Section =====
                ws_data.push(['B2C Invoices - Large (>2.5L Interstate)']);
                ws_data.push(['Invoice No.', 'Date', 'Customer Name', 'Place of Supply', 'Invoice Value', 'Taxable Value', 'IGST']);

                data.b2cl.forEach(inv => {
                    const exRate = inv.exchange_rate || 1.0;
                    const taxable = (inv.subtotal + (inv.bank_charges || 0)) * exRate;
                    const tax = (inv.total_amount - taxable) * exRate;

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
                        inv.subtotal * exRate,
                        (inv.subtotal + (inv.bank_charges || 0)) * exRate,
                        '',
                        ''
                    ]);
                });

                ws_data.push([]);
                ws_data.push([]);

                // ===== HSN Summary Section - Domestic =====
                ws_data.push(['Section 12 - HSN Summary (Domestic)']);
                ws_data.push(['HSN/SAC', 'UQC', 'Quantity', 'Taxable Value', 'IGST', 'CGST', 'SGST', 'Total GST']);

                data.hsnDomestic.forEach(h => {
                    ws_data.push([
                        h.code,
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
                ws_data.push(['HSN/SAC', 'UQC', 'Quantity', 'Taxable Value', 'IGST', 'CGST', 'SGST', 'Total GST']);

                data.hsnExport.forEach(h => {
                    ws_data.push([
                        h.code,
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
                // Show contact picker for the selected customer
                ui.invoice.showContactPicker(id);
            },

            showContactPicker: (customerId) => {
                const customer = state.customers.find(c => c.id === customerId);
                if (!customer) return;

                // Build contacts list: primary contact + additional contacts
                const allContacts = [];

                // 1. Primary contact (from JSONB array)
                const primaryInArray = (customer.contacts && Array.isArray(customer.contacts))
                    ? customer.contacts.find(c => c.is_primary)
                    : null;

                if (primaryInArray) {
                    allContacts.push({ ...primaryInArray, _source: 'jsonb_primary' });
                } else if (customer.contact_name) {
                    // 2. Fallback: Primary contact from top-level fields (if not found in array)
                    allContacts.push({
                        name: customer.contact_name,
                        role: customer.contact_role || '',
                        dept: customer.contact_dept || '',
                        is_primary: true,
                        _source: 'top_level_fallback'
                    });
                }

                // 3. Additional contacts (non-primary ones in array)
                if (customer.contacts && Array.isArray(customer.contacts)) {
                    customer.contacts.filter(c => !c.is_primary).forEach(c => {
                        // Avoid duplicates if primary was already added via fallback but also exists in array without is_primary flag (unlikely but safe)
                        if (!allContacts.find(existing => existing.name === c.name)) {
                            allContacts.push(c);
                        }
                    });
                }

                const picker = document.getElementById('inv-contact-picker');
                const list = document.getElementById('inv-contact-list');
                if (!picker || !list) return;

                if (allContacts.length === 0) {
                    picker.classList.add('hidden');
                    return;
                }

                list.innerHTML = allContacts.map((c, idx) => `
                    <div class="contact-pick-item flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 cursor-pointer transition-colors"
                         onclick="ui.invoice.selectContact(${idx})"
                         data-idx="${idx}">
                        <div>
                            <div class="text-xs font-bold text-slate-900">${c.name || '-'}</div>
                            <div class="text-[10px] text-slate-400">${c.role || c.designation || ''} ${(c.dept || c.department) ? '· ' + (c.dept || c.department) : ''}</div>
                        </div>
                        ${c.is_primary ? '<span class="text-[8px] font-black uppercase tracking-wider bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Primary</span>' : ''}
                    </div>
                `).join('');

                // Store contacts array for selectContact to reference
                picker._contacts = allContacts;
                picker.classList.remove('hidden');
            },

            selectContact: (idx) => {
                const picker = document.getElementById('inv-contact-picker');
                if (!picker || !picker._contacts) return;
                const contact = picker._contacts[idx];
                if (!contact) return;

                const name = contact.name || '';
                const role = contact.role || contact.designation || '';
                const dept = contact.dept || contact.department || '';

                document.getElementById('inv-contact-name').value = name;
                document.getElementById('inv-contact-role').value = role;
                document.getElementById('inv-contact-dept').value = dept;

                // Build chip label
                let label = name;
                if (role) label += ' · ' + role;
                if (dept) label += ' · ' + dept;
                document.getElementById('inv-contact-label').textContent = label;

                document.getElementById('inv-contact-chip').classList.remove('hidden');
                picker.classList.add('hidden');
            },

            clearContact: () => {
                document.getElementById('inv-contact-name').value = '';
                document.getElementById('inv-contact-role').value = '';
                document.getElementById('inv-contact-dept').value = '';
                document.getElementById('inv-contact-chip').classList.add('hidden');
                document.getElementById('inv-contact-label').textContent = '';
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
                <input type="hidden" class="item-product-id" value="${data?.product_id || ''}">
                <input type="text" class="form-input text-xs font-bold bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-300 w-full item-name"
                    placeholder="Enter product/service name..."
                    value="${data?.product_name || ''}">
            </td>
            <td class="p-3">
                <input type="text" class="text-xs font-mono text-slate-400 bg-transparent border-none p-0 focus:ring-0 item-hsn w-full" 
                    placeholder="HSN/SAC"
                    value="${data?.hsn || ''}">
            </td>
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
                const terms = state.settings?.default_invoice_terms || "1. Software Warranty:\nThe software is warranted against any design defects as per the specified requirements for a period of one (1) year from the date of supply. During the warranty period, you will be entitled to free software upgrades and technical support.\n\n2. Equipment Warranty:\nThe equipment carries a warranty of one (1) year from the date of supply. The warranty will be void in the event of misuse, mishandling, unauthorized modifications, or physical damage to the equipment.\n\n3. Installation and Training:\nPlease note that the above-mentioned price does not include physical installation and training services. These services can be provided separately upon request at an additional cost.";
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
                    const productId = row.querySelector('.item-product-id')?.value;
                    const product = state.products.find(p => p.id === productId);
                    const qty = parseFloat(row.querySelector('.item-qty')?.value) || 0;
                    const rate = parseFloat(row.querySelector('.item-rate')?.value) || 0;
                    const discPct = parseFloat(row.querySelector('.item-discount')?.value) || 0;

                    const totalBeforeDisc = qty * rate;
                    const discAmount = (totalBeforeDisc * discPct) / 100;
                    let taxable = totalBeforeDisc - discAmount;

                    taxableAmount += taxable;
                    if (row.querySelector('.row-total')) {
                        row.querySelector('.row-total').textContent = `${symbol}${taxable.toLocaleString(loc, { minimumFractionDigits: 2 })}`;
                    }

                    let taxAmount = 0;
                    if (type === 'Regular') {
                        // Priority: Product's GST > Default 18%
                        const gstRate = product ? (product.gst || 0) : 18;
                        taxAmount = Math.round((taxable * gstRate) * 100) / 10000;

                        if (isInterState) {
                            taxes['IGST'] = Math.round(((taxes['IGST'] || 0) + taxAmount) * 100) / 100;
                        } else {
                            taxes['CGST'] = Math.round(((taxes['CGST'] || 0) + (taxAmount / 2)) * 100) / 100;
                            taxes['SGST'] = Math.round(((taxes['SGST'] || 0) + (taxAmount / 2)) * 100) / 100;
                        }
                    }
                    if (row.querySelector('.row-total-with-tax')) {
                        row.querySelector('.row-total-with-tax').textContent = `${symbol}${(taxable + taxAmount).toLocaleString(loc, { minimumFractionDigits: 2 })}`;
                    }
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

            unlockNumber: () => {
                const el = document.getElementById('inv-no');
                if (el) {
                    el.readOnly = false;
                    el.classList.remove('bg-transparent');
                    el.classList.add('bg-blue-50', 'border-blue-200', 'px-2', 'py-1', 'rounded');
                    el.focus();
                    api.notifications.show('Invoice number unlocked for manual editing.', 'info');
                }
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
                        const setVal = (id, val) => {
                            const el = document.getElementById(id);
                            if (el) el.value = val !== undefined && val !== null ? val : '';
                        };

                        setVal('inv-no', inv.invoice_no);
                        setVal('inv-date', inv.date);
                        if (inv.due_date) setVal('inv-due-date', inv.due_date);
                        setVal('inv-customer', inv.customer_id);
                        setVal('inv-customer-search', inv.customers?.name || '');
                        setVal('inv-type', inv.type || 'Regular');
                        setVal('inv-currency', inv.currency || 'INR');
                        setVal('inv-exchange-rate', inv.exchange_rate || 1.0);
                        setVal('inv-bank', inv.bank_id || 'inr');
                        setVal('inv-purchase-no', inv.purchase_no || '');
                        if (inv.purchase_date) setVal('inv-purchase-date', inv.purchase_date);
                        setVal('inv-notes', inv.notes || '');
                        setVal('inv-bank-charges', inv.bank_charges || 0);
                        setVal('inv-tds', inv.tds_amount || 0);
                        setVal('inv-bank-deduction', inv.bank_charges_deduction || 0);
                        setVal('inv-pbg', inv.pbg_amount || 0);
                        setVal('inv-other-deduction', inv.other_deductions || 0);

                        // Custom Fields
                        if (inv.custom_fields && Array.isArray(inv.custom_fields)) {
                            inv.custom_fields.forEach(cf => ui.invoice.addCustomField(cf.name, cf.value));
                        }

                        // Line Items
                        const container = document.getElementById('inv-line-items');
                        container.innerHTML = '';
                        
                        // Try new metadata format first
                        if (inv.metadata?.items && Array.isArray(inv.metadata.items)) {
                            inv.metadata.items.forEach(item => {
                                ui.invoice.addItem({
                                    product_id: item.product_id || '',
                                    product_name: item.product_name,
                                    hsn: item.hsn || '',
                                    qty: item.qty || 0,
                                    rate: item.rate || 0,
                                    discount: item.discount || 0
                                });
                            });
                        } else if (inv.invoice_items && inv.invoice_items.length > 0) {
                            // Legacy fallback
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

                        // Restore selected contact from metadata
                        if (inv.metadata?.contact_name) {
                            document.getElementById('inv-contact-name').value = inv.metadata.contact_name;
                            document.getElementById('inv-contact-role').value = inv.metadata.contact_role || '';
                            document.getElementById('inv-contact-dept').value = inv.metadata.contact_dept || '';
                            let lbl = inv.metadata.contact_name;
                            if (inv.metadata.contact_role) lbl += ' · ' + inv.metadata.contact_role;
                            if (inv.metadata.contact_dept) lbl += ' · ' + inv.metadata.contact_dept;
                            document.getElementById('inv-contact-label').textContent = lbl;
                            document.getElementById('inv-contact-chip').classList.remove('hidden');
                        }
                    }, 500);

                } catch (err) {
                    console.error('Edit Error:', err);
                    alert('Failed to load invoice: ' + err.message);
                }
            }
        },
        purchase: {
            addItem: (data = null) => {
                const id = Date.now().toString();
                const container = document.getElementById('pur-line-items');
                if (!container) return;
                const row = document.createElement('div');
                row.className = 'line-item-row grid grid-cols-[1fr,80px,120px,120px,40px] gap-4 items-center py-3 border-b border-slate-50 last:border-0';
                row.id = `pur-item-${id}`;
                row.innerHTML = `
                    <input type="text" class="form-input text-xs font-bold bg-transparent border-none p-0 focus:ring-0 pur-item-name" 
                        placeholder="Item name..." value="${data?.product_name || ''}">
                    <input type="number" class="form-input text-xs font-bold bg-slate-50 border-none rounded py-1 text-center pur-item-qty" 
                        value="${data?.qty || 1}" oninput="ui.purchase.updateCalculations()">
                    <input type="number" class="form-input text-xs font-bold bg-transparent border-none p-0 focus:ring-0 pur-item-rate" 
                        value="${data?.rate || 0}" oninput="ui.purchase.updateCalculations()">
                    <span class="text-right font-bold text-slate-700 pur-item-total text-xs tabular-nums">₹0.00</span>
                    <button onclick="ui.purchase.removeItem('${id}')" class="text-slate-300 hover:text-red-500 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                    `;
                container.appendChild(row);
                ui.purchase.updateCalculations();
            },
            removeItem: (id) => {
                const row = document.getElementById(`pur-item-${id}`);
                if (row) row.remove();
                ui.purchase.updateCalculations();
            },
            updateCalculations: () => {
                let subtotal = 0;
                let taxTotal = 0;

                document.querySelectorAll('.pur-item-name').forEach(input => {
                    const row = input.closest('.line-item-row');
                    const qty = parseFloat(row.querySelector('.pur-item-qty').value) || 0;
                    const rate = parseFloat(row.querySelector('.rate-input')?.value || row.querySelector('.pur-item-rate').value) || 0; // Supporting both classes for safety
                    const amount = qty * rate;

                    subtotal += amount;
                    row.querySelector('.pur-item-total').textContent = `₹${amount.toLocaleString()}`;
                    
                    // Default 18% tax for purchases too if not specified
                    taxTotal += (amount * 18) / 100;
                });

                document.getElementById('pur-subtotal').textContent = `₹${subtotal.toLocaleString()}`;
                document.getElementById('pur-tax').textContent = `₹${taxTotal.toLocaleString()}`;
                document.getElementById('pur-total').textContent = `₹${(subtotal + taxTotal).toLocaleString()}`;
            }
        },
        doc: {
            addItem: (data = null) => {
                const id = Date.now().toString();
                const container = document.getElementById('doc-line-items');
                if (!container) return;
                const row = document.createElement('div');
                row.className = 'line-item-row grid grid-cols-[1fr,60px,100px,100px,30px] gap-4 items-center py-3 border-b border-slate-50 last:border-0';
                row.id = `doc-item-${id}`;
                row.innerHTML = `
                            <input type="text" class="form-input text-xs font-bold bg-transparent border-none p-0 focus:ring-0 doc-item-name" 
                                placeholder="Item name..." value="${data?.product_name || ''}">
                            <input type="number" class="form-input text-xs font-bold bg-slate-50 border-none rounded py-1 text-center doc-item-qty" 
                                value="${data?.qty || 1}" oninput="ui.doc.updateCalculations()">
                            <input type="number" class="form-input text-xs font-bold bg-transparent border-none p-0 focus:ring-0 doc-item-rate" 
                                value="${data?.rate || 0}" oninput="ui.doc.updateCalculations()">
                            <span class="text-right font-bold text-slate-700 doc-item-total text-xs tabular-nums">₹0.00</span>
                            <button onclick="ui.doc.removeItem('${id}')" class="text-slate-300 hover:text-red-500 transition-colors">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                            `;
                container.appendChild(row);
                ui.doc.updateCalculations();
            },
            removeItem: (id) => {
                const row = document.getElementById(`doc-item-${id}`);
                if (row) row.remove();
                ui.doc.updateCalculations();
            },
            updateCalculations: () => {
                let subtotal = 0;
                document.querySelectorAll('.doc-item-name').forEach(input => {
                    const row = input.closest('.line-item-row');
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





            addItem: (data = null) => {
                const id = Date.now().toString();
                const container = document.getElementById('pfi-line-items');
                const emptyState = document.getElementById('pfi-empty-state');
                if (!container) return;

                if (emptyState) emptyState.classList.add('hidden');

                const row = document.createElement('tr');
                row.id = `item-${id}`;
                row.innerHTML = `
                                            <td class="p-4">
                                                <input type="text"
                                                    class="form-input text-sm product-name-input w-full bg-transparent border-none font-bold focus:ring-0"
                                                    placeholder="Enter product/service name..."
                                                    value="${data?.product_name || ''}"
                                                    autocomplete="off">
                                            </td>
                                            <td class="p-4">
                                                <input type="text" class="form-input text-sm hsn-input w-full bg-slate-50 border-none rounded-lg font-bold" placeholder="HSN/SAC" value="${data?.hsn || ''}">
                                            </td>
                                            <td class="p-4">
                                                <input type="number" class="form-input text-sm qty-input w-full bg-slate-50 border-none rounded-lg text-center font-bold" value="${data?.qty || 1}" min="1" oninput="ui.proforma_v2.updateCalculations()">
                                            </td>
                                            <td class="p-4">
                                                <input type="number" class="form-input text-sm rate-input w-full bg-transparent border-none font-bold" value="${data?.rate || 0}" min="0" oninput="ui.proforma_v2.updateCalculations()">
                                            </td>
                                            <td class="p-4">
                                                <input type="number" class="form-input text-sm discount-input w-full bg-slate-50 border-none rounded-lg text-center font-bold" value="${data?.discount || 0}" min="0" max="100" oninput="ui.proforma_v2.updateCalculations()">
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
                document.getElementById('pfi-terms').value = `1. Software Warranty:\nThe software is warranted against any design defects as per the specified requirements for a period of one (1) year from the date of supply. During the warranty period, you will be entitled to free software upgrades and technical support.\n\n2. Equipment Warranty:\nThe equipment carries a warranty of one (1) year from the date of supply. The warranty will be void in the event of misuse, mishandling, unauthorized modifications, or physical damage to the equipment.\n\n3. Installation and Training:\nPlease note that the above-mentioned price does not include physical installation and training services. These services can be provided separately upon request at an additional cost.`;
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
                    const name = row.querySelector('.product-name-input').value;
                    const qty = parseFloat(row.querySelector('.qty-input').value) || 0;
                    const rate = parseFloat(row.querySelector('.rate-input').value) || 0;
                    const discPct = parseFloat(row.querySelector('.discount-input').value) || 0;

                    const baseAmount = qty * rate;
                    const discount = (baseAmount * discPct) / 100;
                    const taxable = baseAmount - discount;

                    totalDiscount += discount;
                    taxableTotal += taxable;

                    let gstRate = (pfiType === 'Regular') ? 18 : 0; // Defaulting to 18% for direct entry Regular PFI
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
                            })).filter(f => f.name || f.value),
                            items: []
                        }
                    };

                    rows.forEach(row => {
                        const name = row.querySelector('.product-name-input').value;
                        if (!name) return;
                        proforma.metadata.items.push({
                            product_name: name,
                            hsn: row.querySelector('.hsn-input').value,
                            qty: parseFloat(row.querySelector('.qty-input').value) || 0,
                            rate: parseFloat(row.querySelector('.rate-input').value) || 0,
                            discount: parseFloat(row.querySelector('.discount-input').value) || 0,
                            tax_rate: (pfiType === 'Regular') ? 18 : 0
                        });
                    });

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
                    } else {
                        const { data, error } = await supabaseClient.from('proforma_invoices').insert(proforma).select().single();
                        if (error) throw error;
                        pfiData = data;
                    }

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
                // Show contact picker for the selected customer
                ui.quotation_v2.showContactPicker(id);
            },

            showContactPicker: (customerId) => {
                const customer = state.customers.find(c => c.id === customerId);
                if (!customer) return;

                const allContacts = [];
                const primaryInArray = (customer.contacts && Array.isArray(customer.contacts))
                    ? customer.contacts.find(c => c.is_primary)
                    : null;

                if (primaryInArray) {
                    allContacts.push({ ...primaryInArray, _source: 'jsonb_primary' });
                } else if (customer.contact_name) {
                    allContacts.push({
                        name: customer.contact_name,
                        role: customer.contact_role || '',
                        dept: customer.contact_dept || '',
                        is_primary: true,
                        _source: 'top_level_fallback'
                    });
                }

                if (customer.contacts && Array.isArray(customer.contacts)) {
                    customer.contacts.filter(c => !c.is_primary).forEach(c => {
                        if (!allContacts.find(existing => existing.name === c.name)) {
                            allContacts.push(c);
                        }
                    });
                }

                const picker = document.getElementById('qtn-contact-picker');
                const list = document.getElementById('qtn-contact-list');
                if (!picker || !list) return;

                if (allContacts.length === 0) {
                    picker.classList.add('hidden');
                    return;
                }

                list.innerHTML = allContacts.map((c, idx) => `
                    <div class="contact-pick-item flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 cursor-pointer transition-colors"
                         onclick="ui.quotation_v2.selectContact(${idx})"
                         data-idx="${idx}">
                        <div>
                            <div class="text-xs font-bold text-slate-900">${c.name || '-'}</div>
                            <div class="text-[10px] text-slate-400">${c.role || c.designation || ''} ${(c.dept || c.department) ? '· ' + (c.dept || c.department) : ''}</div>
                        </div>
                        ${c.is_primary ? '<span class="text-[8px] font-black uppercase tracking-wider bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Primary</span>' : ''}
                    </div>
                `).join('');

                picker._contacts = allContacts;
                picker.classList.remove('hidden');
            },

            selectContact: (idx) => {
                const picker = document.getElementById('qtn-contact-picker');
                if (!picker || !picker._contacts) return;
                const contact = picker._contacts[idx];
                if (!contact) return;

                const name = contact.name || '';
                const role = contact.role || contact.designation || '';
                const dept = contact.dept || contact.department || '';

                document.getElementById('qtn-contact-name').value = name;
                document.getElementById('qtn-contact-role').value = role;
                document.getElementById('qtn-contact-dept').value = dept;

                let label = name;
                if (role) label += ' · ' + role;
                if (dept) label += ' · ' + dept;
                document.getElementById('qtn-contact-label').textContent = label;

                document.getElementById('qtn-contact-chip').classList.remove('hidden');
                picker.classList.add('hidden');
            },

            clearContact: () => {
                document.getElementById('qtn-contact-name').value = '';
                document.getElementById('qtn-contact-role').value = '';
                document.getElementById('qtn-contact-dept').value = '';
                document.getElementById('qtn-contact-chip').classList.add('hidden');
                document.getElementById('qtn-contact-label').textContent = '';
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


            addItem: (data = null) => {
                const id = Date.now().toString();
                const container = document.getElementById('qtn-line-items');
                const emptyState = document.getElementById('qtn-empty-state');
                if (!container) return;

                if (emptyState) emptyState.classList.add('hidden');

                const row = document.createElement('tr');
                row.id = `qrow-${id}`;
                row.innerHTML = `
                    <td class="p-4">
                        <input type="text"
                            class="form-input text-sm product-name-input w-full bg-transparent border-none font-bold focus:ring-0"
                            placeholder="Enter product/service name..."
                            value="${data?.product_name || ''}"
                            autocomplete="off">
                    </td>
                    <td class="p-4">
                        <input type="text" class="form-input text-sm hsn-input w-full bg-slate-50 border-none rounded-lg font-bold" placeholder="HSN/SAC" value="${data?.hsn || ''}">
                    </td>
                    <td class="p-4">
                        <input type="number" class="form-input text-sm qty-input w-full bg-slate-50 border-none rounded-lg text-center font-bold" value="${data?.qty || 1}" min="1" oninput="ui.quotation_v2.updateCalculations()">
                    </td>
                    <td class="p-4">
                        <input type="number" class="form-input text-sm rate-input w-full bg-transparent border-none font-bold" value="${data?.rate || 0}" min="0" oninput="ui.quotation_v2.updateCalculations()">
                    </td>
                    <td class="p-4">
                        <input type="number" class="form-input text-sm discount-input w-full bg-slate-50 border-none rounded-lg text-center font-bold" value="${data?.discount || 0}" min="0" max="100" oninput="ui.quotation_v2.updateCalculations()">
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
                document.getElementById('qtn-terms').value = `1. Software Warranty:\nThe software is warranted against any design defects as per the specified requirements for a period of one (1) year from the date of supply. During the warranty period, you will be entitled to free software upgrades and technical support.\n\n2. Equipment Warranty:\nThe equipment carries a warranty of one (1) year from the date of supply. The warranty will be void in the event of misuse, mishandling, unauthorized modifications, or physical damage to the equipment.\n\n3. Installation and Training:\nPlease note that the above-mentioned price does not include physical installation and training services. These services can be provided separately upon request at an additional cost.`;
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
                    const nameInput = row.querySelector('.product-name-input');
                    if (!nameInput) return;
                    const name = nameInput.value;
                    const qty = parseFloat(row.querySelector('.qty-input').value) || 0;
                    const rate = parseFloat(row.querySelector('.rate-input').value) || 0;
                    const discPct = parseFloat(row.querySelector('.discount-input').value) || 0;

                    const baseAmount = qty * rate;
                    const discount = (baseAmount * discPct) / 100;
                    const taxable = baseAmount - discount;

                    totalDiscount += discount;
                    taxableTotal += taxable;

                    let gstRate = (qtnType === 'Regular') ? 18 : 0; 
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

            save: async (isDraft = false, print = false, isRevision = false) => {
                const customerId = document.getElementById('qtn-customer').value;
                if (!customerId) return alert('Please select a customer');

                const rows = document.querySelectorAll('#qtn-line-items tr');
                if (rows.length === 0) return alert('At least one item is required');

                const btn = event.target;
                const originalText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = 'Saving...';

                const maxRetries = 5;
                let attempt = 0;
                let savedSuccess = false;

                while (attempt < maxRetries && !savedSuccess) {
                    attempt++;
                    try {
                        const qtnType = document.getElementById('qtn-type')?.value || 'Regular';

                        // Regenerate Quotation No if this is a retry and not a revision/edit
                        if (attempt > 1 && !isRevision && !ui.quotation_v2.activeId) {
                            console.log(`Retrying save (Attempt ${attempt})... generating new number...`);

                            const currentVal = document.getElementById('qtn-no').value;
                            let nextSeq = 1;
                            let prefix = '';
                            let padding = 3;

                            // 1. Parse current value locally
                            const match = currentVal.match(/(.*-)(\d+)$/);
                            if (match) {
                                prefix = match[1];
                                nextSeq = parseInt(match[2]) + 1;
                                padding = Math.max(match[2].length, 3);
                            }

                            // 2. Check DB for latest to skip ahead if needed
                            const fyStart = state.fy.split('-')[0];
                            const fyEnd = parseInt(state.fy.split('-')[1]) + 2000;

                            const { data: latest, error: fetchErr } = await supabaseClient
                                .from('quotations')
                                .select('quotation_no')
                                .gte('date', `${fyStart}-04-01`)
                                .lte('date', `${fyEnd}-03-31`)
                                .order('quotation_no', { ascending: false })
                                .limit(1);

                            if (!fetchErr && latest && latest.length > 0 && latest[0].quotation_no) {
                                const dbMatch = latest[0].quotation_no.match(/-(\d+)$/);
                                if (dbMatch) {
                                    const dbNext = parseInt(dbMatch[1]) + 1;
                                    if (dbNext > nextSeq) nextSeq = dbNext;
                                }
                            }

                            // 3. Update the input
                            if (prefix) {
                                // If we parsed a prefix, use it
                                const newDocNo = `${prefix}${String(nextSeq).padStart(padding, '0')}`;
                                document.getElementById('qtn-no').value = newDocNo;
                            } else {
                                // Fallback to standard generation if parsing failed
                                const newDocNo = `LGS-QTN-${fyStart}-${String(fyEnd).slice(-2)}-${String(nextSeq).padStart(3, '0')}`;
                                document.getElementById('qtn-no').value = newDocNo;
                            }
                            console.log('New Quotation No:', document.getElementById('qtn-no').value);
                        }

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
                                contact_name: document.getElementById('qtn-contact-name').value,
                                contact_role: document.getElementById('qtn-contact-role').value,
                                contact_dept: document.getElementById('qtn-contact-dept').value,
                                custom_fields: Array.from(document.querySelectorAll('#qtn-custom-fields > div')).map(div => ({
                                    name: div.querySelector('.qcf-name').value,
                                    value: div.querySelector('.qcf-value').value
                                })).filter(f => f.name || f.value),
                                items: []
                            }
                        };

                        rows.forEach(row => {
                            const nameEl = row.querySelector('.product-name-input');
                            if (!nameEl) return;
                            const name = nameEl.value;
                            if (!name) return;
                            quotation.metadata.items.push({
                                product_name: name,
                                hsn: row.querySelector('.hsn-input').value,
                                qty: parseFloat(row.querySelector('.qty-input').value) || 0,
                                rate: parseFloat(row.querySelector('.rate-input').value) || 0,
                                discount: parseFloat(row.querySelector('.discount-input').value) || 0,
                                tax_rate: (qtnType === 'Regular') ? 18 : 0
                            });
                        });

                        let qtnData;
                        if (isRevision) {
                            // Create Revision logic
                            const baseNo = quotation.quotation_no.split('-R')[0];
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
                                quotation.quotation_no = `${baseNo}-R${nextRev}`;
                            } else {
                                quotation.quotation_no = `${baseNo}-R1`;
                            }

                            const { data, error } = await supabaseClient.from('quotations').insert(quotation).select().single();
                            if (error) throw error;
                            qtnData = data;
                        } else if (ui.quotation_v2.activeId) {
                            const { data, error } = await supabaseClient
                                .from('quotations')
                                .update(quotation)
                                .eq('id', ui.quotation_v2.activeId)
                                .select()
                                .single();
                            if (error) throw error;
                            qtnData = data;
                        } else {
                            const { data, error } = await supabaseClient.from('quotations').insert(quotation).select().single();
                            if (error) throw error;
                            qtnData = data;
                        }

                        ui.modal.close();
                        await api.docs.fetch('quotations');
                        api.notifications.show(`Quotation ${isDraft ? 'Draft ' : (isRevision ? 'Revision ' : (ui.quotation_v2.activeId ? 'Updated ' : ''))}Saved Successfully`);

                        if (print) {
                            await api.docs.generatePDF('quotations', qtnData.id, ui.quotation_v2.includeSignature);
                        }

                        savedSuccess = true;

                    } catch (err) {
                        console.error(`Save Attempt ${attempt} Failed:`, err);
                        // Check for duplicate key error (Postgres code 23505) or unique constraint violation message
                        if ((err.code === '23505' || err.message?.includes('violates unique constraint') || err.message?.includes('duplicate key')) && !ui.quotation_v2.activeId && !isRevision) {
                            if (attempt < maxRetries) {
                                console.warn('Duplicate quotation number detected, retrying with new number...');
                                continue; // Retry loop
                            } else {
                                alert('Failed to save after multiple attempts. Please try again manually.');
                            }
                        } else {
                            alert('Save Failed: ' + err.message);
                            break; // Don't retry for other errors
                        }
                    }
                }

                // Always reset button state after loop finishes
                btn.disabled = false;
                btn.innerHTML = originalText;
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
                    const qtn = state.quotations.find(q => q.id === id);
                    if (!qtn) throw new Error('Quotation not found');

                    ui.quotation_v2.activeId = id;
                    ui.quotation_v2.activeStatus = qtn.status;
                    ui.modal.open('quotation-new');

                    // Set basic fields
                    document.getElementById('qtn-no').value = qtn.quotation_no;
                    document.getElementById('qtn-date').value = qtn.date;
                    if (document.getElementById('qtn-validity')) document.getElementById('qtn-validity').value = qtn.validity_date || '';
                    document.getElementById('qtn-subject').value = qtn.subject || '';
                    document.getElementById('qtn-customer').value = qtn.customer_id;
                    const customer = state.customers.find(c => c.id === qtn.customer_id);
                    document.getElementById('qtn-customer-search').value = customer ? customer.name : '';

                    // Handle Contact Metadata
                    if (qtn.metadata?.contact_name) {
                        const name = qtn.metadata.contact_name;
                        const role = qtn.metadata.contact_role || '';
                        const dept = qtn.metadata.contact_dept || '';

                        document.getElementById('qtn-contact-name').value = name;
                        document.getElementById('qtn-contact-role').value = role;
                        document.getElementById('qtn-contact-dept').value = dept;

                        let label = name;
                        if (role) label += ' · ' + role;
                        if (dept) label += ' · ' + dept;
                        document.getElementById('qtn-contact-label').textContent = label;
                        document.getElementById('qtn-contact-chip').classList.remove('hidden');
                    }

                    if (document.getElementById('qtn-type')) document.getElementById('qtn-type').value = qtn.type || 'Regular';
                    if (document.getElementById('qtn-bank')) document.getElementById('qtn-bank').value = qtn.bank_id || '';
                    if (document.getElementById('qtn-payment-terms')) document.getElementById('qtn-payment-terms').value = qtn.payment_terms || '';
                    if (document.getElementById('qtn-delivery-time')) document.getElementById('qtn-delivery-time').value = qtn.delivery_time || '';
                    if (document.getElementById('qtn-delivery-mode')) document.getElementById('qtn-delivery-mode').value = qtn.delivery_mode || '';
                    if (document.getElementById('qtn-terms')) document.getElementById('qtn-terms').value = qtn.terms || '';

                    // Signature toggle
                    ui.quotation_v2.includeSignature = qtn.metadata?.include_signature !== false;
                    const sigToggle = document.getElementById('qtn-sig-toggle');
                    if (sigToggle) {
                        if (ui.quotation_v2.includeSignature) {
                            sigToggle.classList.add('bg-[#fdf2f8]', 'text-[#ec4899]', 'border-[#fbcfe8]');
                            sigToggle.classList.remove('bg-slate-50', 'text-slate-400', 'border-slate-200');
                            document.getElementById('qtn-sig-label').textContent = 'Show Signature on Document';
                        } else {
                            sigToggle.classList.remove('bg-[#fdf2f8]', 'text-[#ec4899]', 'border-[#fbcfe8]');
                            sigToggle.classList.add('bg-slate-50', 'text-slate-400', 'border-slate-200');
                            document.getElementById('qtn-sig-label').textContent = 'Signature Hidden';
                        }
                    }

                    // Export fields
                    if (qtn.type === 'LUT / Export' && document.getElementById('qtn-export-fields')) {
                        document.getElementById('qtn-country').value = qtn.metadata?.country || 'India';
                        document.getElementById('qtn-currency').value = qtn.currency || 'USD';
                        document.getElementById('qtn-exchange-rate').value = qtn.exchange_rate || 1;
                        document.getElementById('qtn-export-fields').classList.remove('hidden');
                    }

                    // Load items
                    const list = document.getElementById('qtn-line-items');
                    if (list) {
                        list.innerHTML = '';
                        
                        // Try new metadata format first
                        if (qtn.metadata?.items && Array.isArray(qtn.metadata.items)) {
                            qtn.metadata.items.forEach(item => {
                                ui.quotation_v2.addItem(item);
                                const row = list.lastElementChild;
                                if (row) {
                                    row.querySelector('.product-name-input').value = item.product_name;
                                    row.querySelector('.hsn-input').value = item.hsn || '';
                                    row.querySelector('.qty-input').value = item.qty;
                                    row.querySelector('.rate-input').value = item.rate;
                                    row.querySelector('.discount-input').value = item.discount || 0;
                                }
                            });
                        } else {
                            // Legacy fallback
                            const { data: items } = await supabaseClient.from('quotation_items').select('*').eq('quotation_id', id);
                            if (items && items.length > 0) {
                                items.forEach(item => {
                                    ui.quotation_v2.addItem();
                                    const row = list.lastElementChild;
                                    if (row) {
                                        const product = state.products.find(p => p.id === item.product_id);
                                        row.querySelector('.product-name-input').value = product ? product.name : 'Unknown Product';
                                        row.querySelector('.hsn-input').value = item.hsn_code || '';
                                        row.querySelector('.qty-input').value = item.qty;
                                        row.querySelector('.rate-input').value = item.rate;
                                        row.querySelector('.discount-input').value = item.discount || 0;
                                    }
                                });
                            }
                        }
                    }

                    // Load custom fields
                    if (qtn.metadata?.custom_fields && document.getElementById('qtn-custom-fields')) {
                        qtn.metadata.custom_fields.forEach(f => ui.quotation_v2.addCustomField(f.name, f.value));
                    }

                    ui.quotation_v2.updateCalculations();
                } catch (err) {
                    console.error('Edit Error:', err);
                    api.notifications.show('Failed to load quotation details', 'error');
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
                    if (typeSelect) typeSelect.value = p.type || 'Regular';
                    if (document.getElementById('pfi-bank-charges')) document.getElementById('pfi-bank-charges').value = p.bank_charges || 0;
                    ui.proforma_v2.toggleExportFields();

                    if (p.type === 'LUT / Export' && document.getElementById('pfi-country')) {
                        document.getElementById('pfi-country').value = p.metadata?.country || '';
                    }

                    // Populate line items
                    const container = document.getElementById('pfi-line-items');
                    if (container) {
                        container.innerHTML = '';
                        
                        // Try new metadata format first
                        if (p.metadata?.items && Array.isArray(p.metadata.items)) {
                            p.metadata.items.forEach(item => {
                                ui.proforma_v2.addItem(item);
                                const lastRow = container.lastElementChild;
                                if (lastRow) {
                                    lastRow.querySelector('.product-name-input').value = item.product_name;
                                    lastRow.querySelector('.hsn-input').value = item.hsn || '';
                                    lastRow.querySelector('.qty-input').value = item.qty || 1;
                                    lastRow.querySelector('.rate-input').value = item.rate || 0;
                                    lastRow.querySelector('.discount-input').value = item.discount || 0;
                                }
                            });
                        } else if (p.proforma_items && p.proforma_items.length > 0) {
                            // Legacy fallback
                            for (const item of p.proforma_items) {
                                ui.proforma_v2.addItem();
                                const lastRow = container.lastElementChild;
                                if (lastRow) {
                                    const product = state.products.find(pr => pr.id === item.product_id);
                                    lastRow.querySelector('.product-name-input').value = product ? product.name : '';
                                    lastRow.querySelector('.hsn-input').value = item.hsn_code || '';
                                    lastRow.querySelector('.qty-input').value = item.qty || 1;
                                    lastRow.querySelector('.rate-input').value = item.rate || 0;
                                    lastRow.querySelector('.discount-input').value = item.discount || 0;
                                }
                            }
                        }
                        ui.proforma_v2.updateCalculations();
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
                // Products module removed to save Supabase storage/memory
                state.products = []; 

                const { data: customers } = await supabaseClient.from('customers').select('*').order('name', { ascending: true });
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
                    api.notifications.show('Item deleted permanently');
                } catch (err) {
                    console.error('Delete Error:', err);
                    alert('Delete Failed: ' + err.message);
                }
            },
            restore: async (table, id) => {
                // Restoration logic for soft-deleted items if needed in future
                api.notifications.show('Restore not applicable for current modules', 'warning');
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
                    const fileFields = ['company_logo', 'signature', 'stamp', 'revenue_stamp'];
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
                        tds_amount: parseFloat(document.getElementById('inv-tds')?.value) || 0,
                        bank_charges_deduction: parseFloat(document.getElementById('inv-bank-deduction')?.value) || 0,
                        pbg_amount: parseFloat(document.getElementById('inv-pbg')?.value) || 0,
                        other_deductions: parseFloat(document.getElementById('inv-other-deduction')?.value) || 0,
                        status: (() => {
                            if (isDraft) return 'Draft';
                            if (ui.invoice.activeId) {
                                const existing = state.invoices.find(i => i.id === ui.invoice.activeId);
                                if (existing && (existing.status === 'Paid' || existing.status === 'Cancelled' || existing.status === 'Pending')) {
                                    return existing.status;
                                }
                            }
                            return 'Pending';
                        })(),
                        metadata: {
                            converted_from_pfi: ui.invoice.sourcePfiId || null,
                            conversion_date: ui.invoice.sourcePfiId ? new Date().toISOString() : null,
                            contact_name: document.getElementById('inv-contact-name')?.value || null,
                            contact_role: document.getElementById('inv-contact-role')?.value || null,
                            contact_dept: document.getElementById('inv-contact-dept')?.value || null,
                            items: []
                        }
                    };

                    document.querySelectorAll('#inv-line-items tr').forEach(row => {
                        const name = row.querySelector('.item-name').value;
                        if (!name) return;

                        invoice.metadata.items.push({
                            product_name: name,
                            hsn: row.querySelector('.item-hsn').value,
                            qty: parseFloat(row.querySelector('.item-qty').value) || 0,
                            rate: parseFloat(row.querySelector('.item-rate').value) || 0,
                            discount: parseFloat(row.querySelector('.item-discount').value) || 0,
                            tax_rate: 18 // Defaulting to 18% for now as per current app logic or we can make it dynamic later
                        });
                    });

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

                    // Calculate status before saving: Expiring Soon = Expires within current month
                    const ed = new Date(data.end_date);
                    const now = new Date();
                    now.setHours(0, 0, 0, 0);
                    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

                    if (ed < now) data.status = 'Expired';
                    else if (ed <= endOfMonth) data.status = 'Expiring Soon';
                    else data.status = 'Active';

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

                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF();
                    
                    let items = [];
                    // Try new metadata format first
                    if (inv.metadata?.items && Array.isArray(inv.metadata.items)) {
                        items = inv.metadata.items.map(it => ({
                            ...it,
                            products: { name: it.product_name, hsn: it.hsn }
                        }));
                    } else {
                        // Legacy fallback
                        const { data: legacyItems, error: itemErr } = await supabaseClient
                            .from('invoice_items')
                            .select('*, products(*)')
                            .eq('invoice_id', id);
                        if (itemErr) throw itemErr;
                        items = legacyItems || [];
                    }

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
                    regional: {}, // State-wise aggregation
                    hsn: {}, // table 12
                    hsnByMonth: {}
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
                const { data: legacyItems } = await supabaseClient
                    .from('invoice_items')
                    .select('*, products(name, gst, hsn)')
                    .in('invoice_id', invIds);

                // Collect all items (Legacy + JSONB)
                const allItems = [];
                if (legacyItems) allItems.push(...legacyItems.map(it => ({ ...it, _source: 'legacy' })));

                state.invoices.forEach(inv => {
                    if (inv.metadata?.items && Array.isArray(inv.metadata.items)) {
                        inv.metadata.items.forEach(it => {
                            allItems.push({
                                ...it,
                                invoice_id: inv.id,
                                hsn_code: it.hsn,
                                product_name: it.product_name,
                                _source: 'json'
                            });
                        });
                    }

                    if (!isWithinFY(inv.date, state.fy)) return;
                    const exRate = inv.exchange_rate || 1.0;
                    const taxable = inv.subtotal * exRate;
                    // Tax = (Total - Subtotal - BankCharges) * ExRate
                    const tax = (inv.total_amount - inv.subtotal - (inv.bank_charges || 0)) * exRate;
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

                    // Regional aggregation
                    const stateName = inv.customers?.state || 'Unknown';
                    if (!results.regional[stateName]) {
                        results.regional[stateName] = { revenue: 0, count: 0 };
                    }
                    results.regional[stateName].revenue += totalINR;
                    results.regional[stateName].count += 1;
                });

                // HSN Aggregation (Monthly Wise)
                if (allItems.length > 0) {
                    allItems.forEach(item => {
                        const inv = state.invoices.find(i => i.id === item.invoice_id);
                        if (!inv || !inv.date) return;
                        if (!isWithinFY(inv.date, state.fy)) return;

                        const exRate = inv.exchange_rate || 1.0;
                        const hsn = item.hsn_code || 'N/A';

                        // Get Month Label (e.g., "April 2024")
                        const invDate = new Date(inv.date);
                        const monthLabel = invDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

                        if (!results.hsnByMonth[monthLabel]) {
                            results.hsnByMonth[monthLabel] = { domestic: {}, exports: {} };
                        }

                        const category = (inv.type === 'LUT / Export') ? 'exports' : 'domestic';

                        if (!results.hsnByMonth[monthLabel][category][hsn]) {
                            results.hsnByMonth[monthLabel][category][hsn] = {
                                code: hsn,
                                desc: item.product_name || item.products?.name || 'Item',
                                taxable: 0,
                                cgst: 0,
                                sgst: 0,
                                igst: 0,
                                count: 0
                            };
                        }

                        if (!results.hsn[hsn]) {
                            results.hsn[hsn] = {
                                code: hsn,
                                desc: item.product_name || item.products?.name || 'Item',
                                taxable: 0,
                                cgst: 0,
                                sgst: 0,
                                igst: 0,
                                count: 0
                            };
                        }
                        const rowTaxable = (item.qty * item.rate * (1 - (item.discount || 0) / 100)) * exRate;
                        
                        let gstRate = 0;
                        if (inv.type !== 'Without GST' && inv.type !== 'LUT / Export') {
                            if (item._source === 'legacy') {
                                gstRate = item.products?.gst || 0;
                            } else {
                                // Default to 18 if no specific tax rate found in JSON metadata
                                gstRate = item.tax_rate !== undefined ? item.tax_rate : (item.gst !== undefined ? item.gst : 18);
                            }
                        }
                        
                        const rowTax = (rowTaxable * gstRate) / 100;

                        const custStateCode = String(inv.customers?.state || '').substring(0, 2);
                        const isInterstate = myStateCode && custStateCode && myStateCode !== custStateCode;

                        let rowCGST = 0, rowSGST = 0, rowIGST = 0;
                        if (inv.type !== 'LUT / Export') {
                            if (isInterstate) {
                                rowIGST = rowTax;
                            } else {
                                rowCGST = rowTax / 2;
                                rowSGST = rowTax / 2;
                            }
                        }

                        results.hsnByMonth[monthLabel][category][hsn].taxable += rowTaxable;
                        results.hsnByMonth[monthLabel][category][hsn].cgst += rowCGST;
                        results.hsnByMonth[monthLabel][category][hsn].sgst += rowSGST;
                        results.hsnByMonth[monthLabel][category][hsn].igst += rowIGST;
                        results.hsnByMonth[monthLabel][category][hsn].count += (item.qty || 0);

                        results.hsn[hsn].taxable += rowTaxable;
                        results.hsn[hsn].cgst += rowCGST;
                        results.hsn[hsn].sgst += rowSGST;
                        results.hsn[hsn].igst += rowIGST;
                        results.hsn[hsn].count += (item.qty || 0);
                    });
                }

                results.purchases.tax = state.purchases
                    .filter(pur => isWithinFY(pur.date, state.fy))
                    .reduce((sum, pur) => sum + (pur.tax_amount || 0), 0);
                results.purchases.taxable = state.purchases
                    .filter(pur => isWithinFY(pur.date, state.fy))
                    .reduce((sum, pur) => sum + (pur.subtotal || 0), 0);

                state.reports = results;
                render();
            },
            exportHSNToExcel: () => {
                try {
                    const data = state.reports;
                    if (!data || !data.hsnByMonth) {
                        api.notifications.show('No data available to export', 'warning');
                        return;
                    }

                    const monthOrder = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                    const months = Object.keys(data.hsnByMonth).sort((a, b) => {
                        const [mA, yA] = a.split(' ');
                        const [mB, yB] = b.split(' ');
                        if (yA !== yB) return yA - yB;
                        return monthOrder.indexOf(mA) - monthOrder.indexOf(mB);
                    });

                    const excelData = [];
                    let grandTaxable = 0;
                    let grandCGST = 0;
                    let grandSGST = 0;
                    let grandIGST = 0;
                    let grandQty = 0;

                    months.forEach(month => {
                        const domestic = Object.values(data.hsnByMonth[month].domestic || {});
                        const exports = Object.values(data.hsnByMonth[month].exports || {});

                        if (domestic.length === 0 && exports.length === 0) return;

                        let monthlyTaxable = 0;
                        let monthlyCGST = 0;
                        let monthlySGST = 0;
                        let monthlyIGST = 0;
                        let monthlyQty = 0;

                        const addRows = (list, category) => {
                            list.forEach(h => {
                                excelData.push({
                                    'Month': month,
                                    'Category': category,
                                    'HSN/SAC': h.code,
                                    'Count': h.count,
                                    'Taxable Value': h.taxable,
                                    'CGST': h.cgst,
                                    'SGST': h.sgst,
                                    'IGST': h.igst,
                                    'Total Value': h.taxable + h.cgst + h.sgst + h.igst
                                });
                                monthlyTaxable += h.taxable;
                                monthlyCGST += h.cgst;
                                monthlySGST += h.sgst;
                                monthlyIGST += h.igst;
                                monthlyQty += h.count;
                            });
                        };

                        addRows(domestic, 'Domestic');
                        addRows(exports, 'Export');

                        excelData.push({
                            'Month': `${month} TOTAL`,
                            'Category': '',
                            'HSN/SAC': '',
                            'Count': monthlyQty,
                            'Taxable Value': monthlyTaxable,
                            'CGST': monthlyCGST,
                            'SGST': monthlySGST,
                            'IGST': monthlyIGST,
                            'Total Value': monthlyTaxable + monthlyCGST + monthlySGST + monthlyIGST
                        });
                        excelData.push({});

                        grandTaxable += monthlyTaxable;
                        grandCGST += monthlyCGST;
                        grandSGST += monthlySGST;
                        grandIGST += monthlyIGST;
                        grandQty += monthlyQty;
                    });

                    excelData.push({
                        'Month': `GRAND TOTAL (FY ${state.fy})`,
                        'Category': '',
                        'HSN/SAC': '',
                        'Count': grandQty,
                        'Taxable Value': grandTaxable,
                        'CGST': grandCGST,
                        'SGST': grandSGST,
                        'IGST': grandIGST,
                        'Total Value': grandTaxable + grandCGST + grandSGST + grandIGST
                    });

                    const wb = XLSX.utils.book_new();
                    const ws = XLSX.utils.json_to_sheet(excelData);

                    const wscols = [
                        { wch: 25 }, // Month
                        { wch: 15 }, // Category
                        { wch: 15 }, // HSN/SAC
                        { wch: 12 }, // Count
                        { wch: 18 }, // Taxable Value
                        { wch: 12 }, // CGST
                        { wch: 12 }, // SGST
                        { wch: 12 }, // IGST
                        { wch: 18 }  // Total Value
                    ];
                    ws['!cols'] = wscols;

                    XLSX.utils.book_append_sheet(wb, ws, "HSN Summary");
                    XLSX.writeFile(wb, `HSN_Unified_${state.fy}_${new Date().getTime()}.xlsx`);

                    api.notifications.show('Excel Export Successful', 'success');
                } catch (err) {
                    console.error('Excel Export Error:', err);
                    api.notifications.show('Failed to export Excel', 'error');
                }
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
                        
                        // Try new metadata format first
                        if (pfi.metadata?.items && Array.isArray(pfi.metadata.items)) {
                            pfi.metadata.items.forEach(item => {
                                ui.invoice.addItem({
                                    product_name: item.product_name,
                                    hsn: item.hsn || '',
                                    qty: item.qty,
                                    rate: item.rate,
                                    discount: item.discount || 0
                                });
                            });
                        } else if (pfi.proforma_items && pfi.proforma_items.length > 0) {
                            // Legacy fallback
                            pfi.proforma_items.forEach(item => {
                                ui.invoice.addItem({
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
            convertQuotationToProForma: async (quotationId) => {
                if (!confirm('Convert this Quotation to a Pro Forma Invoice?')) return;

                try {
                    // 1. Fetch Quotation and its items
                    const { data: quotation, error: qtnError } = await supabaseClient
                        .from('quotations')
                        .select('*, quotation_items(*, products(name, hsn))')
                        .eq('id', quotationId)
                        .single();

                    if (qtnError) throw qtnError;

                    // 2. Open Pro Forma Modal
                    ui.modal.open('proforma-new');

                    // 3. Mark source and active state
                    ui.proforma_v2.activeId = null;

                    // 4. Map Quotation fields to Pro Forma form
                    // Wait for modal to render
                    setTimeout(() => {
                        document.getElementById('pfi-customer').value = quotation.customer_id;
                        const cust = state.customers.find(c => c.id === quotation.customer_id);
                        if (cust) document.getElementById('pfi-customer-search').value = cust.name;

                        document.getElementById('pfi-type').value = quotation.type || 'Regular';
                        if (document.getElementById('pfi-currency')) document.getElementById('pfi-currency').value = quotation.currency || 'INR';
                        document.getElementById('pfi-bank').value = quotation.bank_id || 'inr';
                        document.getElementById('pfi-payment-terms').value = quotation.payment_terms || '';
                        document.getElementById('pfi-delivery-time').value = quotation.delivery_time || '';
                        document.getElementById('pfi-delivery-mode').value = quotation.delivery_mode || '';
                        document.getElementById('pfi-terms').value = quotation.terms || '';
                        if (document.getElementById('pfi-bank-charges')) document.getElementById('pfi-bank-charges').value = quotation.bank_charges || 0;

                        // Custom Fields
                        if (quotation.metadata?.custom_fields && Array.isArray(quotation.metadata.custom_fields)) {
                            quotation.metadata.custom_fields.forEach(cf => ui.proforma_v2.addCustomField(cf.name, cf.value));
                        }

                        // Line Items
                        const container = document.getElementById('pfi-line-items');
                        container.innerHTML = '';
                        
                        // Try new metadata format first
                        if (quotation.metadata?.items && Array.isArray(quotation.metadata.items)) {
                            quotation.metadata.items.forEach(item => {
                                ui.proforma_v2.addItem({
                                    product_name: item.product_name,
                                    hsn: item.hsn || '',
                                    qty: item.qty,
                                    rate: item.rate,
                                    discount: item.discount || 0
                                });
                            });
                        } else if (quotation.quotation_items && quotation.quotation_items.length > 0) {
                            // Legacy fallback
                            quotation.quotation_items.forEach(item => {
                                ui.proforma_v2.addItem({
                                    product_name: item.products?.name || '',
                                    hsn: item.hsn_code || item.products?.hsn || '',
                                    qty: item.qty,
                                    rate: item.rate,
                                    discount: item.discount || 0
                                });
                            });
                        }

                        ui.proforma_v2.toggleExportFields();
                        ui.proforma_v2.updateCalculations();
                        ui.proforma_v2.updateDocNo();
                    }, 500);

                } catch (err) {
                    console.error('Conversion Error:', err);
                    api.notifications.show('Failed to convert Quotation to PFI: ' + err.message, 'error');
                }
            },
            convertQuotationToInvoice: async (quotationId) => {
                if (!confirm('Convert this Quotation to a Tax Invoice?')) return;

                try {
                    // 1. Fetch Quotation and its items
                    const { data: quotation, error: qtnError } = await supabaseClient
                        .from('quotations')
                        .select('*, quotation_items(*, products(name, hsn))')
                        .eq('id', quotationId)
                        .single();

                    if (qtnError) throw qtnError;

                    // 2. Open Invoice Modal
                    ui.modal.open('invoice');

                    // 3. Mark active state
                    ui.invoice.activeId = null;
                    ui.invoice.sourcePfiId = null;

                    // 4. Map Quotation fields to Invoice form
                    // Wait for modal to render
                    setTimeout(() => {
                        document.getElementById('inv-customer').value = quotation.customer_id;
                        const cust = state.customers.find(c => c.id === quotation.customer_id);
                        if (cust) document.getElementById('inv-customer-search').value = cust.name;

                        document.getElementById('inv-type').value = quotation.type || 'Regular';
                        if (document.getElementById('inv-currency')) document.getElementById('inv-currency').value = quotation.currency || 'INR';
                        if (document.getElementById('inv-exchange-rate')) document.getElementById('inv-exchange-rate').value = '1.00';
                        document.getElementById('inv-bank').value = quotation.bank_id || 'inr';
                        document.getElementById('inv-payment-terms').value = quotation.payment_terms || '';
                        document.getElementById('inv-delivery-time').value = quotation.delivery_time || '';
                        document.getElementById('inv-delivery-mode').value = quotation.delivery_mode || '';
                        document.getElementById('inv-notes').value = quotation.terms || '';
                        if (document.getElementById('inv-bank-charges')) document.getElementById('inv-bank-charges').value = quotation.bank_charges || 0;

                        // Custom Fields
                        if (quotation.metadata?.custom_fields && Array.isArray(quotation.metadata.custom_fields)) {
                            quotation.metadata.custom_fields.forEach(cf => ui.invoice.addCustomField(cf.name, cf.value));
                        }

                        // Line Items
                        const container = document.getElementById('inv-line-items');
                        container.innerHTML = '';
                        
                        // Try new metadata format first
                        if (quotation.metadata?.items && Array.isArray(quotation.metadata.items)) {
                            quotation.metadata.items.forEach(item => {
                                ui.invoice.addItem({
                                    product_name: item.product_name,
                                    hsn: item.hsn || '',
                                    qty: item.qty,
                                    rate: item.rate,
                                    discount: item.discount || 0
                                });
                            });
                        } else if (quotation.quotation_items && quotation.quotation_items.length > 0) {
                            // Legacy fallback
                            quotation.quotation_items.forEach(item => {
                                ui.invoice.addItem({
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
                    api.notifications.show('Failed to convert Quotation to Invoice: ' + err.message, 'error');
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
                        user_id: state.user.id,
                        metadata: {
                            items: []
                        }
                    };

                    document.querySelectorAll('.doc-item-name').forEach(input => {
                        const row = input.closest('.line-item-row');
                        doc.metadata.items.push({
                            product_name: input.value,
                            qty: parseFloat(row.querySelector('.doc-item-qty').value) || 0,
                            rate: parseFloat(row.querySelector('.doc-item-rate').value) || 0
                        });
                    });

                    const { data: docData, error: docError } = await supabaseClient.from(tableMap[type]).insert(doc).select().single();

                    if (docError) throw docError;
                    ui.modal.close();
                    await api.docs.fetch(type);
                    alert(`${type.charAt(0).toUpperCase() + type.slice(1, -1)} Saved Successfully!`);

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
            migrateLineItems: async () => {
                console.log('🚀 Starting Line Item Migration...');
                try {
                    const migrations = [
                        { table: 'invoices', itemTable: 'invoice_items', idField: 'invoice_id' },
                        { table: 'proforma_invoices', itemTable: 'proforma_items', idField: 'proforma_id' },
                        { table: 'quotations', itemTable: 'quotation_items', idField: 'quotation_id' }
                    ];

                    for (const m of migrations) {
                        console.log(`Migrating ${m.table}...`);
                        const { data: docs } = await supabaseClient.from(m.table).select('*');
                        if (!docs) continue;

                        for (const doc of docs) {
                            // Only migrate if items don't exist in metadata
                            if (!doc.metadata?.items || doc.metadata.items.length === 0) {
                                const { data: items } = await supabaseClient
                                    .from(m.itemTable)
                                    .select('*, products(name, hsn)')
                                    .eq(m.idField, doc.id);

                                if (items && items.length > 0) {
                                    const newMetadata = {
                                        ...(doc.metadata || {}),
                                        items: items.map(it => ({
                                            product_name: it.products?.name || 'Unknown Item',
                                            hsn: it.products?.hsn || it.hsn_code || '',
                                            qty: it.qty || 1,
                                            rate: it.rate || 0,
                                            discount: it.discount || 0,
                                            tax_rate: 18 // Default
                                        }))
                                    };
                                    await supabaseClient.from(m.table).update({ metadata: newMetadata }).eq('id', doc.id);
                                }
                            }
                        }
                    }

                    console.log('✅ Migration Complete!');
                    api.notifications.show('Data Migration Successful');
                    // Refresh state
                    await api.invoices.fetch();
                    await api.docs.fetch('proforma');
                    await api.docs.fetch('quotations');
                } catch (err) {
                    console.error('Migration Failed:', err);
                    api.notifications.show('Migration Failed: ' + err.message, 'error');
                }
            },
            pdfModel: {
                fetchData: async (type, id) => {
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

                    const { data: doc, error: docErr } = await supabaseClient
                        .from(tableMap[type])
                        .select('*, customers(*)')
                        .eq('id', id)
                        .single();
                    if (docErr) throw docErr;

                    let items = [];
                    // Try new metadata format first
                    if (doc.metadata?.items && Array.isArray(doc.metadata.items)) {
                        const docType = doc.type || 'Regular';
                        const defaultTax = (docType === 'Regular') ? 18 : 0;

                        items = doc.metadata.items.map(it => ({
                            ...it,
                            products: { 
                                name: it.product_name || 'Item', 
                                hsn: it.hsn || '',
                                gst: it.tax_rate !== undefined ? it.tax_rate : (it.gst !== undefined ? it.gst : defaultTax)
                            }
                        }));
                    } else {
                        // Legacy fallback
                        const { data: legacyItems, error: itemErr } = await supabaseClient
                            .from(itemTableMap[type])
                            .select('*, products(*)')
                            .eq(docIdFieldMap[type], id);
                        if (itemErr) throw itemErr;
                        items = legacyItems || [];
                    }

                    return { doc, items };
                },

                getTitle: (type) => {
                    const titleMap = {
                        quotations: 'QUOTATION', proforma: 'PRO FORMA INVOICE', challans: 'DELIVERY CHALLAN',
                        credit_notes: 'CREDIT NOTE', debit_notes: 'DEBIT NOTE', purchase_orders: 'PURCHASE ORDER',
                        invoices: 'TAX INVOICE', ledger: 'STATEMENT OF ACCOUNT'
                    };
                    return titleMap[type] || 'DOCUMENT';
                },

                initPDF: (type, doc, settings) => {
                    const { jsPDF } = window.jspdf;
                    const pdf = new jsPDF();

                    if (window.FONTS_POPPINS_REGULAR) {
                        pdf.addFileToVFS('Poppins-Regular.ttf', window.FONTS_POPPINS_REGULAR);
                        pdf.addFont('Poppins-Regular.ttf', 'Poppins', 'normal');
                    }
                    if (window.FONTS_POPPINS_BOLD) {
                        pdf.addFileToVFS('Poppins-BOLD.ttf', window.FONTS_POPPINS_BOLD);
                        pdf.addFont('Poppins-BOLD.ttf', 'Poppins', 'bold');
                    }
                    pdf.setFont('Poppins', 'normal');

                    const pdfDocNumber = doc.invoice_no || doc.doc_no || doc.quotation_no || doc.id.slice(0, 8);
                    pdf.setProperties({
                        title: `${api.docs.pdfModel.getTitle(type)} - ${pdfDocNumber}`,
                        subject: api.docs.pdfModel.getTitle(type),
                        author: settings.company_name || 'LaGa Systems',
                        keywords: 'invoice, gst, tax, business',
                        creator: 'LaGa Business Suite'
                    });

                    return pdf;
                },

                renderHeader: (pdf, doc, type, settings, margin, pageWidth) => {
                    // Header Box
                    pdf.setDrawColor(0, 0, 0);
                    pdf.setLineWidth(0.1);
                    pdf.rect(margin, margin, pageWidth - (margin * 2), 10); // Top Title Box
                    pdf.setFontSize(10);
                    pdf.setFont('Poppins', 'bold');
                    const title = api.docs.pdfModel.getTitle(type);
                    pdf.text(title, pageWidth / 2, margin + 7, { align: 'center' });
                    pdf.setFontSize(7);
                    pdf.text('ORIGINAL FOR RECIPIENT', pageWidth - margin - 2, margin + 7, { align: 'right' });

                    // Company Info Box (Left Half)
                    const leftBoxWidth = (pageWidth - (margin * 2)) / 2;
                    const textPadding = 22; // Unified indent from margin
                    const contentX = margin + textPadding;

                    // Dynamic Height Calculation
                    pdf.setFontSize(8.5);
                    pdf.setFont('Poppins', 'normal');
                    const splitAddr = pdf.splitTextToSize(settings.address || '', leftBoxWidth - textPadding - 2);

                    const gstinY_calc = margin + 21 + (splitAddr.length * 4.2) + 4;
                    const contactYStart_calc = gstinY_calc + 9;
                    const lastTextY = contactYStart_calc + 4;
                    const leftBoxHeight = lastTextY - (margin + 10);

                    const detailsLineHeight = 4.5;
                    const labelOffset = 32;
                    pdf.setFontSize(8);
                    pdf.setFont('Poppins', 'normal');
                    const visibleDetails = [
                        { label: `${type === 'quotations' ? 'Quotation' : type === 'proforma' ? 'Pro Forma Invoice' : 'Invoice'} No:`, value: doc.invoice_no || doc.doc_no || doc.quotation_no || doc.id.slice(0, 8), bold: true },
                        { label: 'Dated:', value: formatDate(doc.date) },
                        { label: 'Purchase No:', value: doc.purchase_no || doc.metadata?.purchase_no || '-', hide: type !== 'proforma' && type !== 'invoices' },
                        { label: 'Purchase Date:', value: (doc.purchase_date || doc.metadata?.purchase_date) ? formatDate(doc.purchase_date || doc.metadata.purchase_date) : '-', hide: type !== 'proforma' && type !== 'invoices' },
                        { label: 'Validity End Date:', value: doc.validity_date ? formatDate(doc.validity_date) : '-', hide: type !== 'quotations' && !doc.validity_date },
                        { label: 'Payment Terms:', value: doc.payment_terms || '-' },
                        { label: 'Delivery Time:', value: doc.delivery_time || '-' },
                        { label: 'Delivery Mode:', value: doc.delivery_mode || '-' }
                    ].filter(d => !d.hide).map(d => {
                        if (d.bold) {
                            pdf.setFont('Poppins', 'bold');
                            d.splitVal = pdf.splitTextToSize(String(d.value), leftBoxWidth - labelOffset - 7);
                            pdf.setFont('Poppins', 'normal');
                        } else {
                            d.splitVal = pdf.splitTextToSize(String(d.value), leftBoxWidth - labelOffset - 7);
                        }
                        return d;
                    });
                    let totalLines = 0;
                    visibleDetails.forEach(d => totalLines += d.splitVal.length);
                    const rightBoxHeight = 6 + (totalLines * detailsLineHeight) + 1.5;

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
                    pdf.text(settings.company_name || 'LaGa Systems Pvt Ltd', contentX, margin + 16.5);

                    pdf.setFontSize(8.5);
                    pdf.setFont('Poppins', 'normal');
                    pdf.text(splitAddr, contentX, margin + 21);

                    const cinY = margin + 21 + (splitAddr.length * 4.2);
                    const gstinY = cinY + 4;
                    pdf.setFontSize(7.5);
                    pdf.setFont('Poppins', 'normal');
                    pdf.text(`CIN No.: ${settings.cin_no || 'U72200TG2007PTC053444'}`, contentX, cinY);
                    pdf.text(`GSTIN: ${settings.gstin || '-'}`, contentX, gstinY);
                    pdf.text(`PAN: ${settings.pan_no || '-'} | MSME: ${settings.msme_no || '-'}`, contentX, gstinY + 4);

                    const contactYStart_new = gstinY + 9;
                    pdf.setFontSize(6.5);
                    pdf.setFont('Poppins', 'normal');
                    const cleanWeb = (settings.website || '').replace(/^https?:\/\//, '');
                    pdf.text(`Email: ${settings.company_email || '-'} | Ph: ${settings.company_phone || '-'}`, contentX, contactYStart_new);
                    pdf.text(`Web: ${cleanWeb || '-'}`, contentX, contactYStart_new + 3.5);

                    // Document Details Box (Right Half Content)
                    const detailX = rightBoxX + 5;
                    let currentY = margin + 17.5;

                    visibleDetails.forEach((detail) => {
                        pdf.setFontSize(8);
                        pdf.setFont('Poppins', 'normal');
                        pdf.text(detail.label, detailX, currentY);
                        if (detail.bold) pdf.setFont('Poppins', 'bold');
                        pdf.text(detail.splitVal, detailX + labelOffset, currentY);
                        currentY += detail.splitVal.length * detailsLineHeight;
                    });

                    return { dynamicHeaderHeight, rightBoxX };
                },

                renderAddresses: (pdf, doc, y, margin, pageWidth) => {
                    const custBoxWidth = (pageWidth - (margin * 2)) / 2;

                    const getDisplayState = (code) => {
                        if (!code) return '';
                        const st = Constants.States.find(s => s.code === code || s.name === code);
                        return st ? st.name : code;
                    };

                    const billingLines = [
                        `${doc.customers?.billing_address1 || ''} ${doc.customers?.billing_address2 || ''}`.trim(),
                        `${doc.customers?.billing_city || ''}${doc.customers?.billing_pincode ? ' ' + doc.customers.billing_pincode : ''}${doc.customers?.state ? ', ' + getDisplayState(doc.customers.state) : ''}`.trim(),
                        (doc.customers?.billing_country || 'India').trim()
                    ].filter(line => line.length > 0);
                    const billingAddr = billingLines.join('\n');
                    const splitBill = pdf.splitTextToSize(billingAddr, custBoxWidth - 10);

                    let contactLines = [];
                    if (doc.metadata?.contact_name) {
                        let line1 = 'Attn: ' + doc.metadata.contact_name;
                        if (doc.metadata.contact_role) line1 += ' | ' + doc.metadata.contact_role;
                        contactLines.push(...pdf.splitTextToSize(line1, custBoxWidth - 6));
                        if (doc.metadata.contact_dept) {
                            contactLines.push(...pdf.splitTextToSize(doc.metadata.contact_dept, custBoxWidth - 6));
                        }
                    }

                    let customerHeadHeight = 9;
                    if (contactLines.length > 0) customerHeadHeight += (contactLines.length * 4);
                    if (doc.customers?.gstin || doc.customers?.pan_no) customerHeadHeight += 4;
                    const leftContentHeight = customerHeadHeight + 4 + (splitBill.length * 4);

                    const shippingLines = [
                        (doc.customers?.shipping_title || doc.customers?.name || '').trim(),
                        `${doc.customers?.shipping_address1 || ''} ${doc.customers?.shipping_address2 || ''}`.trim(),
                        `${doc.customers?.shipping_city || ''}${doc.customers?.shipping_pincode ? ' ' + doc.customers.shipping_pincode : ''}${doc.customers?.state ? ', ' + getDisplayState(doc.customers.state) : ''}`.trim(),
                        (doc.customers?.shipping_country || 'India').trim()
                    ].filter(line => line.length > 0);
                    const shippingAddr = shippingLines.join('\n');
                    const splitShip = pdf.splitTextToSize(shippingAddr, custBoxWidth - 10);
                    const rightContentHeight = 9 + (splitShip.length * 4);

                    const custBoxDynamicHeight = Math.max(leftContentHeight, rightContentHeight) + 1.5;

                    // Draw Boxes
                    pdf.rect(margin, y, custBoxWidth, custBoxDynamicHeight);
                    pdf.rect(margin + custBoxWidth, y, custBoxWidth, custBoxDynamicHeight);

                    // Left Content
                    pdf.setFontSize(7);
                    pdf.setFont('Poppins', 'bold');
                    pdf.text('Billing Address:', margin + 2, y + 4);
                    pdf.setFontSize(9);
                    pdf.text(doc.customers?.name || 'Walk-in Customer', margin + 2, y + 9);

                    pdf.setFontSize(8);
                    pdf.setFont('Poppins', 'normal');
                    pdf.text(splitBill, margin + 2, y + 13.5);
                    let currentCustY = y + 13.5 + (splitBill.length * 4);

                    if (doc.customers?.gstin || doc.customers?.pan_no) {
                        pdf.setFontSize(7.5);
                        pdf.setFont('Poppins', 'bold');
                        let regInfo = [];
                        if (doc.customers.gstin) regInfo.push(`GSTIN: ${doc.customers.gstin}`);
                        if (doc.customers.pan_no) regInfo.push(`PAN: ${doc.customers.pan_no}`);
                        pdf.text(regInfo.join(' | '), margin + 2, currentCustY + 1);
                        currentCustY += 4;
                    }

                    if (contactLines.length > 0) {
                        pdf.setFontSize(7.5);
                        pdf.setFont('Poppins', 'normal');
                        pdf.text(contactLines, margin + 2, currentCustY + 1);
                    }

                    // Right Content
                    pdf.setFontSize(7);
                    pdf.setFont('Poppins', 'bold');
                    pdf.text('Shipping address:', margin + custBoxWidth + 2, y + 4);
                    pdf.setFontSize(8);
                    pdf.setFont('Poppins', 'normal');
                    pdf.text(splitShip, margin + custBoxWidth + 2, y + 9);

                    return custBoxDynamicHeight;
                },

                getStateCode: (val, gstinFallback) => {
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
                },

                renderLineItems: (pdf, items, doc, settings, startY, margin) => {
                    let totalQty = 0;
                    let totalTaxable = 0;
                    let totalTaxAmt = 0;
                    let totalGrand = 0;

                    const myStateCode = api.docs.pdfModel.getStateCode(settings?.state, settings?.gstin);
                    const customerStateCode = api.docs.pdfModel.getStateCode(doc.customers?.state, doc.customers?.gstin);
                    const isInterState = customerStateCode !== myStateCode;

                    const currency = doc.currency || 'INR';
                    const symbol = { 'INR': 'Rs.', 'USD': '$', 'EUR': '€' }[currency] || currency;
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

                        const row = [idx + 1, item.products?.name || 'Custom Item', item.products?.hsn || '-', item.qty, item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })];
                        if (hasDiscount) row.push(`${discPct}%`);
                        row.push(taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 }));

                        if (isInterState) {
                            row.push(`${gstRate}%`, taxAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 }));
                        } else {
                            const halfRate = gstRate / 2;
                            const halfAmt = taxAmt / 2;
                            row.push(`${halfRate}%`, halfAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 }), `${halfRate}%`, halfAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 }));
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
                    if (hasDiscount) headerRow1.push({ content: 'Disc.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } });
                    headerRow1.push({ content: 'Taxable Value', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } });
                    if (isInterState) {
                        headerRow1.push({ content: 'IGST', colSpan: 2, styles: { halign: 'center', valign: 'middle' } });
                    } else {
                        headerRow1.push({ content: 'CGST', colSpan: 2, styles: { halign: 'center', valign: 'middle' } }, { content: 'SGST', colSpan: 2, styles: { halign: 'center', valign: 'middle' } });
                    }
                    headerRow1.push({ content: 'Total', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } });

                    const headerRow2 = isInterState ? [{ content: '%', styles: { halign: 'center' } }, { content: 'Amount', styles: { halign: 'center' } }] : [{ content: '%', styles: { halign: 'center' } }, { content: 'Amount', styles: { halign: 'center' } }, { content: '%', styles: { halign: 'center' } }, { content: 'Amount', styles: { halign: 'center' } }];

                    const baseColStyles = { 0: { cellWidth: 8, halign: 'center' }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 13, halign: 'center' }, 3: { cellWidth: 9, halign: 'center' }, 4: { cellWidth: 19, halign: 'right' } };
                    let colIdx = 5;
                    if (hasDiscount) baseColStyles[colIdx++] = { cellWidth: 10, halign: 'center' };
                    baseColStyles[colIdx++] = { cellWidth: 22, halign: 'right' };
                    if (isInterState) {
                        baseColStyles[colIdx++] = { cellWidth: 10, halign: 'center' };
                        baseColStyles[colIdx++] = { cellWidth: 18, halign: 'right' };
                    } else {
                        baseColStyles[colIdx++] = { cellWidth: 8, halign: 'center' };
                        baseColStyles[colIdx++] = { cellWidth: 18, halign: 'right' };
                        baseColStyles[colIdx++] = { cellWidth: 8, halign: 'center' };
                        baseColStyles[colIdx++] = { cellWidth: 18, halign: 'right' };
                    }
                    baseColStyles[colIdx++] = { cellWidth: 21, halign: 'right' };

                    pdf.autoTable({
                        startY, head: [headerRow1, headerRow2], body: tableData,
                        foot: [
                            [
                                { content: 'Total', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
                                { content: totalQty, styles: { halign: 'center', fontStyle: 'bold' } },
                                { content: '', styles: { fillColor: [240, 240, 240] } },
                                ...(hasDiscount ? [{ content: '', styles: { fillColor: [240, 240, 240] } }] : []),
                                { content: totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
                                ...(isInterState
                                    ? [{ content: '', styles: { fillColor: [240, 240, 240] } }, { content: totalTaxAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } }]
                                    : [{ content: '', styles: { fillColor: [240, 240, 240] } }, { content: (totalTaxAmt / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } }, { content: '', styles: { fillColor: [240, 240, 240] } }, { content: (totalTaxAmt / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } }]
                                ),
                                { content: totalGrand.toLocaleString('en-IN', { minimumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } }
                            ],
                            ...(doc.bank_charges > 0 ? [[{ content: 'Bank Charges', colSpan: colIdx - 1, styles: { halign: 'right', fontStyle: 'bold' } }, { content: doc.bank_charges.toLocaleString('en-IN', { minimumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } }]] : []),
                            ...(doc.metadata?.round_off ? [[{ content: 'Round Off', colSpan: colIdx - 1, styles: { halign: 'right', fontStyle: 'bold' } }, { content: (doc.total_amount - (totalGrand + (doc.bank_charges || 0))).toLocaleString('en-IN', { minimumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } }]] : []),
                            [{ content: 'Grand Total', colSpan: colIdx - 1, styles: { halign: 'right', fontStyle: 'bold' } }, { content: doc.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } }]
                        ],
                        theme: 'grid',
                        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, fontStyle: 'bold', fontSize: 7, font: 'Poppins' },
                        footStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, fontSize: 7, font: 'Poppins' },
                        styles: { fontSize: 7, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.1, font: 'Poppins' },
                        columnStyles: baseColStyles, margin: { left: margin, right: margin }
                    });

                    return { finalY: pdf.lastAutoTable.finalY, isInterState };
                },

                renderHSNSummary: (pdf, items, isInterState, startY, margin, exchangeRate = 1.0) => {
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
                        startY,
                        head: [[{ content: 'HSN/SAC', rowSpan: 2 }, { content: 'Taxable Value', rowSpan: 2 }, { content: 'Central Tax', colSpan: 2 }, { content: 'State Tax', colSpan: 2 }, { content: 'Total Tax Amount', rowSpan: 2 }], ['Rate', 'Amount', 'Rate', 'Amount']],
                        body: hsnRows,
                        theme: 'grid',
                        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, fontSize: 7, halign: 'center', fontStyle: 'bold', font: 'Poppins' },
                        styles: { fontSize: 7, halign: 'right', lineColor: [0, 0, 0], lineWidth: 0.1, cellPadding: 2, font: 'Poppins' },
                        columnStyles: { 0: { halign: 'left', cellWidth: 30 }, 1: { cellWidth: 35 }, 2: { cellWidth: 20 }, 3: { cellWidth: 25 }, 4: { cellWidth: 20 }, 5: { cellWidth: 25 }, 6: { cellWidth: 'auto' } },
                        margin: { left: margin, right: margin }
                    });

                    return pdf.lastAutoTable.finalY;
                },

                renderFooter: (pdf, doc, settings, startY, margin, pageWidth, pageHeight, options) => {
                    let finalY = startY;
                    const footerHeight = 45;
                    if (finalY + footerHeight > pageHeight - 20) { pdf.addPage(); finalY = margin; }

                    pdf.setLineWidth(0.1);
                    pdf.rect(margin, finalY, pageWidth - (margin * 2), footerHeight);

                    // Bank Details
                    pdf.setFontSize(7);
                    pdf.setFont('Poppins', 'bold');
                    pdf.text('Bank Details:', margin + 2, finalY + 6);
                    pdf.setFont('Poppins', 'normal');
                    const bankPrefix = (doc.type === 'LUT / Export') ? 'bank_usd' : 'bank_inr';
                    pdf.text(`Bank Name:`, margin + 2, finalY + 12);
                    pdf.text(settings[`${bankPrefix}_name`] || '-', margin + 30, finalY + 12);
                    pdf.text(`Account No:`, margin + 2, finalY + 17);
                    pdf.text(settings[`${bankPrefix}_acc_no`] || '-', margin + 30, finalY + 17);
                    const isUsd = bankPrefix === 'bank_usd';
                    pdf.text(isUsd ? 'SWIFT Code:' : 'IFSC Code:', margin + 2, finalY + 22);
                    pdf.text(settings[`${bankPrefix}_${isUsd ? 'swift' : 'ifsc'}`] || '-', margin + 30, finalY + 22);
                    pdf.text(`Branch:`, margin + 2, finalY + 27);
                    pdf.text(settings[`${bankPrefix}_branch`] || '-', margin + 30, finalY + 27);

                    // Signature & Stamps
                    const displayName = settings.company_name?.startsWith('M/s') ? settings.company_name : `M/s ${settings.company_name || 'LaGa Systems'}`;
                    pdf.setFontSize(8);
                    pdf.setFont('Poppins', 'bold');
                    pdf.text(`For ${displayName}`, pageWidth - margin - 2, finalY + 8, { align: 'right' });

                    if (settings.stamp && options.includeCompanyStamp) {
                        try { pdf.addImage(settings.stamp, 'PNG', pageWidth - margin - 65, finalY + 11, 25, 25); } catch (e) { }
                    }
                    if (settings.revenue_stamp && options.showRevenueStamp) {
                        try { pdf.addImage(settings.revenue_stamp, 'PNG', pageWidth - margin - 38, finalY + 12, 33, 25); } catch (e) { }
                    }
                    if (options.showSignature && settings.signature) {
                        try { pdf.addImage(settings.signature, 'PNG', pageWidth - margin - 33, finalY + 10, 30, 20); } catch (e) { }
                    }

                    pdf.setFontSize(7);
                    pdf.text('Authorized Signatory', pageWidth - margin - 2, finalY + 40, { align: 'right' });

                    return finalY + footerHeight;
                },

                renderTerms: (pdf, doc, startY, margin, pageWidth, pageHeight) => {
                    const fallbackTerms = "1. Software Warranty:\nThe software is warranted against any design defects as per the specified requirements for a period of one (1) year from the date of supply. During the warranty period, you will be entitled to free software upgrades and technical support.\n\n2. Equipment Warranty:\nThe equipment carries a warranty of one (1) year from the date of supply. The warranty will be void in the event of misuse, mishandling, unauthorized modifications, or physical damage to the equipment.\n\n3. Installation and Training:\nPlease note that the above-mentioned price does not include physical installation and training services. These services can be provided separately upon request at an additional cost.";
                    const splitTerms = pdf.splitTextToSize(doc.terms || fallbackTerms, pageWidth - (margin * 2) - 4);
                    const termsBoxHeight = 9 + (splitTerms.length * 3.5) + 2;
                    let finalY = startY;
                    if (finalY + termsBoxHeight > pageHeight - 10) { pdf.addPage(); finalY = margin; }

                    pdf.setLineWidth(0.1);
                    pdf.rect(margin, finalY, pageWidth - (margin * 2), termsBoxHeight);
                    pdf.setFont('Poppins', 'bold');
                    pdf.text('Terms and Conditions:', margin + 2, finalY + 5);
                    pdf.setFont('Poppins', 'normal');
                    pdf.text(splitTerms, margin + 2, finalY + 9);

                    // Dynamic Pagination & Footer (Applied to ALL pages)
                    const totalPages = pdf.internal.getNumberOfPages();
                    const userStr = state.user?.email || 'User';
                    const now = new Date();
                    const printDateStr = now.toLocaleDateString('en-IN') + ' ' + now.toLocaleTimeString('en-IN');

                    for (let i = 1; i <= totalPages; i++) {
                        pdf.setPage(i);
                        pdf.setFontSize(6);
                        pdf.setFont('Poppins', 'normal');
                        pdf.setTextColor(100);
                        pdf.text(`Page ${i}/${totalPages} | Printed by ${userStr} on ${printDateStr}`, margin, pageHeight - 5);
                    }
                },

                renderPreview: (type, id, doc, items, options) => {
                    const { doc: data, items: list } = { doc, items };
                    const pdfBlob = options.pdf.output('blob');
                    const pdfUrl = URL.createObjectURL(pdfBlob);
                    const title = api.docs.pdfModel.getTitle(type);
                    const docNumber = doc.invoice_no || doc.doc_no || doc.quotation_no || doc.id.slice(0, 8);
                    const filename = `${docNumber}.pdf`;
                    const isInvoice = type === 'invoices';

                    const modal = document.createElement('div');
                    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center;';

                    const modalContent = document.createElement('div');
                    modalContent.style.cssText = 'width: 90%; height: 90%; background: white; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column;';

                    const header = document.createElement('div');
                    header.style.cssText = 'padding: 16px; background: #f8f9fa; border-bottom: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center;';

                    header.innerHTML = `
                        <h3 style="margin: 0; font-size: 18px; font-weight: 600;">${title} - ${docNumber}</h3>
                        <div style="display: flex; gap: 12px; align-items: center;">
                            ${!isInvoice ? `
                            <label style="display: flex; align-items: center; gap: 6px; font-size: 14px; cursor: pointer;">
                                <input type="checkbox" id="signature-toggle" ${options.includeSignature ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px;">
                                <span style="font-weight: 500;">Signature</span>
                            </label>` : ''}
                            ${isInvoice ? `
                            <label style="display: flex; align-items: center; gap: 6px; font-size: 14px; cursor: pointer;">
                                <input type="checkbox" id="revenue-toggle" ${options.includeRevenueStamp ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px;">
                                <span style="font-weight: 500;">Revenue Stamp</span>
                            </label>` : ''}
                            <label style="display: flex; align-items: center; gap: 6px; font-size: 14px; cursor: pointer;">
                                <input type="checkbox" id="company-stamp-toggle" ${options.includeCompanyStamp ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px;">
                                <span style="font-weight: 500;">Company Stamp</span>
                            </label>
                            <a href="${pdfUrl}" download="${filename}" style="padding: 8px 16px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">Download PDF</a>
                            <button class="close-pdf-modal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6c757d;">&times;</button>
                        </div>
                    `;

                    const iframe = document.createElement('iframe');
                    iframe.src = pdfUrl;
                    iframe.style.cssText = 'flex: 1; border: none; width: 100%;';

                    modalContent.appendChild(header);
                    modalContent.appendChild(iframe);
                    modal.appendChild(modalContent);
                    document.body.appendChild(modal);

                    const reRender = async () => {
                        modal.remove();
                        URL.revokeObjectURL(pdfUrl);
                        const sig = header.querySelector('#signature-toggle')?.checked ?? options.includeSignature;
                        const rev = header.querySelector('#revenue-toggle')?.checked ?? options.includeRevenueStamp;
                        const co = header.querySelector('#company-stamp-toggle')?.checked ?? options.includeCompanyStamp;
                        await api.docs.generatePDF(type, id, sig, rev, co);
                    };

                    header.querySelector('#signature-toggle')?.addEventListener('change', reRender);
                    header.querySelector('#revenue-toggle')?.addEventListener('change', reRender);
                    header.querySelector('#company-stamp-toggle')?.addEventListener('change', reRender);
                    header.querySelector('.close-pdf-modal').onclick = () => { modal.remove(); URL.revokeObjectURL(pdfUrl); };
                    modal.onclick = (e) => { if (e.target === modal) { modal.remove(); URL.revokeObjectURL(pdfUrl); } };
                }
            },

            generatePDF: async (type, id, includeSignature = true, includeRevenueStamp = true, includeCompanyStamp = true) => {
                try {
                    const model = api.docs.pdfModel;
                    const { doc, items } = await model.fetchData(type, id);
                    const settings = state.settings || {};

                    // Metadata Preference
                    let finalIncludeSignature = includeSignature;
                    if (doc.metadata && doc.metadata.include_signature !== undefined && includeSignature === true) {
                        finalIncludeSignature = doc.metadata.include_signature;
                    }

                    const pdf = model.initPDF(type, doc, settings);
                    const pageWidth = pdf.internal.pageSize.width;
                    const pageHeight = pdf.internal.pageSize.height;
                    const margin = 10;

                    // Header
                    const { dynamicHeaderHeight } = model.renderHeader(pdf, doc, type, settings, margin, pageWidth);

                    // Addresses
                    const custBoxHeight = model.renderAddresses(pdf, doc, margin + 10 + dynamicHeaderHeight, margin, pageWidth);

                    // Line Items
                    const { finalY, isInterState } = model.renderLineItems(pdf, items, doc, settings, margin + 10 + dynamicHeaderHeight + custBoxHeight, margin);

                    // Amount in Words
                    pdf.setLineWidth(0.1);
                    pdf.rect(margin, finalY, pageWidth - (margin * 2), 10);
                    pdf.setFontSize(8);
                    pdf.text(`Amount Chargeable (in words): ${doc.currency || 'INR'} ${numberToWords(doc.total_amount, doc.currency)}`, margin + 2, finalY + 6.5);
                    pdf.setFont('Poppins', 'bolditalic');
                    pdf.text('E & O.E', pageWidth - margin - 15, finalY + 6.5);

                    // HSN Summary
                    const hsnY = model.renderHSNSummary(pdf, items, isInterState, finalY + 10, margin, parseFloat(doc.exchange_rate) || 1.0);

                    // Custom Specs/Fields
                    let nextY = hsnY;
                    const customFieldRows = doc.custom_fields || [];
                    if (customFieldRows.length > 0) {
                        const h = 5 + (customFieldRows.length * 5);
                        if (nextY + h > pageHeight - 60) { pdf.addPage(); nextY = margin; }
                        pdf.rect(margin, nextY, pageWidth - (margin * 2), h);
                        pdf.setFontSize(7); pdf.setFont('Poppins', 'bold');
                        pdf.text('Additional Information:', margin + 2, nextY + 4);
                        pdf.setFont('Poppins', 'normal');
                        let cfY = nextY + 9;
                        customFieldRows.forEach(cf => {
                            if (cf.name && cf.value) {
                                pdf.setFont('Poppins', 'bold'); pdf.text(`${cf.name}:`, margin + 2, cfY);
                                pdf.setFont('Poppins', 'normal'); pdf.text(cf.value, margin + 40, cfY);
                                cfY += 5;
                            }
                        });
                        nextY += h + 2;
                    }

                    // Footer
                    const footerY = model.renderFooter(pdf, doc, settings, nextY, margin, pageWidth, pageHeight, {
                        showSignature: !(type === 'invoices') && finalIncludeSignature,
                        showRevenueStamp: (type === 'invoices') && includeRevenueStamp,
                        includeCompanyStamp: includeCompanyStamp
                    });

                    // Terms
                    model.renderTerms(pdf, doc, footerY, margin, pageWidth, pageHeight);

                    // Preview
                    model.renderPreview(type, id, doc, items, {
                        pdf, includeSignature: finalIncludeSignature, includeRevenueStamp, includeCompanyStamp
                    });

                } catch (err) {
                    console.error('PDF Error:', err);
                    alert('PDF Generation failed: ' + err.message);
                }
            },

            generateLedger: async (customerId) => {
                try {
                    const customer = state.customers.find(c => c.id === customerId);
                    if (!customer) throw new Error('Customer not found');

                    const invoices = state.invoices
                        .filter(i => i.customer_id === customerId)
                        .sort((a, b) => new Date(a.date) - new Date(b.date));

                    const settings = state.settings || {};
                    const { jsPDF } = window.jspdf;
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    const pageWidth = pdf.internal.pageSize.width;
                    const pageHeight = pdf.internal.pageSize.height;
                    const margin = 10;

                    const model = api.docs.pdfModel;
                    
                    // Header
                    const dummyDoc = { 
                        invoice_no: '-', 
                        date: new Date().toISOString() 
                    };
                    const { dynamicHeaderHeight } = model.renderHeader(pdf, dummyDoc, 'ledger', settings, margin, pageWidth);

                    // Customer info
                    const headerBottomY = margin + 10 + dynamicHeaderHeight;
                    pdf.setFontSize(10);
                    pdf.setFont('Poppins', 'bold');
                    pdf.setTextColor(0);
                    pdf.text('Statement For:', margin, headerBottomY + 10);
                    pdf.setFont('Poppins', 'normal');
                    pdf.text(customer.name, margin, headerBottomY + 15);
                    
                    const addressLines = [
                        customer.billing_address || customer.address || '',
                        customer.city || '',
                        customer.gstin ? `GSTIN: ${customer.gstin}` : ''
                    ].filter(l => l);
                    
                    let addrY = headerBottomY + 20;
                    addressLines.forEach(line => {
                        pdf.text(line, margin, addrY);
                        addrY += 5;
                    });

                    // Ledger Table
                    const head = [['Date', 'Particulars', 'Debit (Inv)', 'Credit (Recv)', 'Balance']];
                    let runningBalance = 0;
                    const body = invoices.map(inv => {
                        const debit = inv.total_amount || 0;
                        const credit = inv.status === 'Paid' ? debit : 0;
                        runningBalance += (debit - credit);
                        
                        return [
                            new Date(inv.date).toLocaleDateString('en-IN'),
                            `Invoice: ${inv.invoice_no}`,
                            debit.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                            credit.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                            runningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })
                        ];
                    });

                    pdf.autoTable({
                        startY: addrY + 5,
                        head: head,
                        body: body,
                        theme: 'striped',
                        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], font: 'Poppins', fontStyle: 'bold' },
                        styles: { font: 'Poppins', fontSize: 9 },
                        columnStyles: {
                            2: { halign: 'right' },
                            3: { halign: 'right' },
                            4: { halign: 'right', fontStyle: 'bold' }
                        },
                        margin: { left: margin, right: margin }
                    });

                    // Deductions Summary Section
                    const invoicesWithDeductions = invoices.filter(inv => 
                        (inv.tds_amount > 0 || inv.bank_charges_deduction > 0 || inv.pbg_amount > 0 || inv.other_deductions > 0)
                    );

                    let nextY = pdf.lastAutoTable.finalY + 10;

                    if (invoicesWithDeductions.length > 0) {
                        // Check for page overflow
                        if (nextY > pageHeight - 40) { pdf.addPage(); nextY = margin; }

                        pdf.setFontSize(10);
                        pdf.setFont('Poppins', 'bold');
                        pdf.setTextColor(51, 65, 85);
                        pdf.text('Deductions Summary:', margin, nextY);
                        
                        const dedHead = [['Date', 'Invoice #', 'TDS', 'Bank Chg', 'PBG', 'Other', 'Total']];
                        const dedBody = invoicesWithDeductions.map(inv => {
                            const total = (inv.tds_amount || 0) + (inv.bank_charges_deduction || 0) + (inv.pbg_amount || 0) + (inv.other_deductions || 0);
                            return [
                                new Date(inv.date).toLocaleDateString('en-IN'),
                                inv.invoice_no,
                                (inv.tds_amount || 0).toLocaleString('en-IN'),
                                (inv.bank_charges_deduction || 0).toLocaleString('en-IN'),
                                (inv.pbg_amount || 0).toLocaleString('en-IN'),
                                (inv.other_deductions || 0).toLocaleString('en-IN'),
                                total.toLocaleString('en-IN', { minimumFractionDigits: 2 })
                            ];
                        });

                        pdf.autoTable({
                            startY: nextY + 5,
                            head: dedHead,
                            body: dedBody,
                            theme: 'grid',
                            headStyles: { fillColor: [100, 116, 139], textColor: [255, 255, 255], font: 'Poppins', fontStyle: 'bold' },
                            styles: { font: 'Poppins', fontSize: 8 },
                            columnStyles: {
                                2: { halign: 'right' },
                                3: { halign: 'right' },
                                4: { halign: 'right' },
                                5: { halign: 'right' },
                                6: { halign: 'right', fontStyle: 'bold' }
                            },
                            margin: { left: margin, right: margin }
                        });
                        nextY = pdf.lastAutoTable.finalY + 10;
                    }

                    // Summary
                    if (nextY > pageHeight - 20) { pdf.addPage(); nextY = margin; }
                    pdf.setFontSize(11);
                    pdf.setFont('Poppins', 'bold');
                    pdf.setTextColor(0);
                    const totalText = `Total Outstanding: Rs. ${runningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                    const textWidth = pdf.getTextWidth(totalText);
                    pdf.text(totalText, pageWidth - margin - textWidth, nextY);

                    // Preview
                    const pdfBlob = pdf.output('blob');
                    const pdfUrl = URL.createObjectURL(pdfBlob);
                    const filename = `Statement_${customer.name.replace(/\s+/g, '_')}.pdf`;

                    const modal = document.createElement('div');
                    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center;';
                    modal.innerHTML = `
                        <div style="width: 90%; height: 90%; background: white; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column;">
                            <div style="padding: 16px; background: #f8f9fa; border-bottom: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center;">
                                <h3 style="margin: 0; font-family: Poppins, sans-serif;">Statement of Account - ${customer.name}</h3>
                                <div style="display: flex; gap: 12px; align-items: center;">
                                    <a href="${pdfUrl}" download="${filename}" style="padding: 8px 16px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600; font-family: Poppins, sans-serif;">Download PDF</a>
                                    <button class="close-pdf-modal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6c757d;">&times;</button>
                                </div>
                            </div>
                            <iframe src="${pdfUrl}" style="flex: 1; border: none; width: 100%;"></iframe>
                        </div>
                    `;
                    document.body.appendChild(modal);
                    modal.querySelector('.close-pdf-modal').onclick = () => { modal.remove(); URL.revokeObjectURL(pdfUrl); };

                } catch (err) {
                    console.error('Ledger Error:', err);
                    alert('Failed to generate ledger: ' + err.message);
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

