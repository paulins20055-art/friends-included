"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { AppState, Employee, Expense, Sale } from "@/lib/types";

const eur = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });
const telegramBotUrl = "https://t.me/friends_included_arturs_bot";
const googleSheetsUrl = "https://docs.google.com/spreadsheets/d/1lxdg7IDC3XCOdYGRSxxCnZhsyQv_HaJlzCKA5_QXYmg/edit";

async function call(url: string, body?: Record<string, unknown>) {
  const response = await fetch(url, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : undefined);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

const input = (form: FormData, key: string) => String(form.get(key) ?? "");

export default function Home() {
  const [state, setState] = useState<AppState | null>(null);
  const [role, setRole] = useState("svetlana");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"overview" | "submit" | "manager" | "records" | "setup">("overview");

  const refresh = useCallback(async () => {
    try { setState(await call(`/api/state?actorId=${encodeURIComponent(role)}`)); setError(""); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not load data."); }
  }, [role]);
  useEffect(() => { void refresh(); }, [refresh]);
  const employee = state?.employees.find((item) => item.id === role);

  async function action(work: () => Promise<unknown>, message: string) {
    setBusy(true); setError(""); setNotice("");
    try { await work(); await refresh(); setNotice(message); }
    catch (err) { setError(err instanceof Error ? err.message : "Action failed."); }
    finally { setBusy(false); }
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top"><span className="brandMark">FI</span><span>Friends Included<small>Finance desk</small></span></a>
        <div className="identity">
          <label htmlFor="role">Demonstration role</label>
          <select id="role" value={role} onChange={(event) => { setState(null); setRole(event.target.value); }}>
            {(state?.employees ?? fallbackEmployees).map((person) => <option key={person.id} value={person.id}>{person.display_name}</option>)}
          </select>
          <span className={`role role-${employee?.role ?? "manager"}`}>{employee?.role ?? "manager"}</span>
        </div>
      </header>

      <section className="hero" id="top">
        <div><p className="eyebrow">Wedding operations · finance control</p><h1>Every guest has a story.<br/>Every euro has a record.</h1>
          <p>Submit sales and expenses, approve decisions, and keep Telegram, Supabase and Google Sheets in step.</p></div>
        <div className="heroStamp"><span>LIVE</span><strong>{state?.sales.length ?? 0}</strong><small>sales records</small></div>
      </section>

      <nav className="tabs" aria-label="Application sections">
        {(["overview", "submit", "manager", "records", "setup"] as const).map((name) =>
          <button key={name} className={tab === name ? "active" : ""} onClick={() => setTab(name)}>{name}</button>)}
      </nav>

      {(notice || error) && <div className={`message ${error ? "error" : "success"}`}>{error || notice}</div>}

      {!state && !error && <div className="loading">Loading the finance desk…</div>}
      {!state && error && <SetupBlock compact />}

      {state && tab === "overview" && <Overview state={state} />}
      {state && tab === "submit" && <SubmitForms role={role} employee={employee} busy={busy} action={action} />}
      {state && tab === "manager" && <Manager state={state} role={role} busy={busy} action={action} />}
      {state && tab === "records" && <Records state={state} role={role} busy={busy} action={action} />}
      {state && tab === "setup" && <SetupBlock state={state} role={role} busy={busy} action={action} />}

      <footer>
        <span>{process.env.NEXT_PUBLIC_STUDENT_NAME || "Student name"} · Day 4 homework</span>
        <div><a href={telegramBotUrl}>Telegram bot</a><a href={googleSheetsUrl}>Google Sheets</a><a href={process.env.NEXT_PUBLIC_GITHUB_URL || "#"}>GitHub</a></div>
      </footer>
    </main>
  );
}

function Overview({ state }: { state: AppState }) {
  const d = state.dashboard;
  return <section className="panel stack">
    <div className="sectionHead"><div><p className="eyebrow">Current position</p><h2>Financial overview</h2></div><span>Approved figures only unless noted</span></div>
    <div className="metricGrid">
      <Metric label="Company result" value={d.company.result} emphasis />
      <Metric label="Approved income" value={d.company.income} />
      <Metric label="Commission expense" value={d.company.commission} />
      <Metric label="All recorded expenses" value={d.company.expenses} />
    </div>
    <div className="projectGrid">
      <Project title="Project A" subtitle="Respectable Relatives" data={d.projectA} accent="coral" />
      <Project title="Project B" subtitle="Drunk University Friends" data={d.projectB} accent="blue" />
      <div className="card commissionCard"><p className="kicker">Commission earned</p>
        {[['Richard',d.commissions.richard],['Anastasia',d.commissions.anastasia],['Jean-Claude',d.commissions.jeanClaude]].map(([name,value])=><div className="moneyRow" key={String(name)}><span>{name}</span><strong>{eur.format(Number(value))}</strong></div>)}
        <div className="moneyRow total"><span>Total</span><strong>{eur.format(d.commissions.total)}</strong></div>
      </div>
    </div>
    <div className="attention"><span>{state.sales.filter(s=>s.status==='pending').length}</span> pending sales <i/> <span>{state.expenses.filter(e=>e.status==='awaiting_allocation').length}</span> expenses awaiting allocation <i/> <span>{d.company.awaiting ? eur.format(d.company.awaiting) : "€0.00"}</span> unallocated</div>
  </section>;
}

function Metric({ label, value, emphasis=false }: { label: string; value: number; emphasis?: boolean }) {
  return <div className={`metric ${emphasis ? "emphasis" : ""}`}><span>{label}</span><strong>{eur.format(value)}</strong></div>;
}

function Project({ title, subtitle, data, accent }: { title:string; subtitle:string; data:{income:number;commission:number;expenses:number;result:number}; accent:string }) {
  return <div className={`card project ${accent}`}><p className="kicker">{title}</p><h3>{subtitle}</h3>
    <div className="moneyRow"><span>Approved income</span><strong>{eur.format(data.income)}</strong></div>
    <div className="moneyRow"><span>Commission</span><strong>−{eur.format(data.commission)}</strong></div>
    <div className="moneyRow"><span>Expenses</span><strong>−{eur.format(data.expenses)}</strong></div>
    <div className="moneyRow total"><span>Result</span><strong>{eur.format(data.result)}</strong></div></div>;
}

function SubmitForms({ role, employee, busy, action }: { role:string; employee?:Employee; busy:boolean; action:(w:()=>Promise<unknown>,m:string)=>Promise<void> }) {
  const allowedSale = employee?.role === "sales"; const allowedExpense = employee?.role === "expense";
  function sale(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const f=new FormData(event.currentTarget); void action(()=>call('/api/sales',{actorId:role,ref:input(f,'ref'),customer:input(f,'customer'),project:input(f,'project'),description:input(f,'description'),amount:input(f,'amount'),richardPct:input(f,'richardPct'),anastasiaPct:input(f,'anastasiaPct'),jeanClaudePct:input(f,'jeanClaudePct')}),'Sale recorded.'); }
  function expense(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const f=new FormData(event.currentTarget); void action(()=>call('/api/expenses',{actorId:role,ref:input(f,'ref'),description:input(f,'description'),category:input(f,'category'),amount:input(f,'amount'),allocation:input(f,'allocation')}),'Expense recorded.'); }
  return <section className="panel"><div className="sectionHead"><div><p className="eyebrow">New transaction</p><h2>Record it while it is fresh</h2></div><span>Active: {employee?.display_name}</span></div>
    <div className="formGrid"><form className="card formCard" onSubmit={sale}><h3>New sale</h3><p>Sales begin as pending and do not affect results until approved.</p><fieldset disabled={!allowedSale||busy}>
      <label>Reference<input name="ref" placeholder="S01" required/></label><label>Customer<input name="customer" placeholder="Olivia Rose" required/></label>
      <label>Project<select name="project"><option value="A">A · Respectable Relatives</option><option value="B">B · Drunk University Friends</option></select></label>
      <label>Amount (€)<input name="amount" type="number" min="0.01" step="0.01" required/></label><label className="wide">Description<input name="description" required/></label>
      <div className="wide split"><label>Richard %<input name="richardPct" type="number" defaultValue="50"/></label><label>Anastasia %<input name="anastasiaPct" type="number" defaultValue="30"/></label><label>Jean-Claude %<input name="jeanClaudePct" type="number" defaultValue="20"/></label></div>
      <button className="primary wide">Record pending sale</button></fieldset>{!allowedSale&&<p className="locked">Select a salesperson role to use this form.</p>}</form>
      <form className="card formCard" onSubmit={expense}><h3>New expense</h3><p>Every saved expense immediately reduces the company result.</p><fieldset disabled={!allowedExpense||busy}>
      <label>Reference<input name="ref" placeholder="E01" required/></label><label>Amount (€)<input name="amount" type="number" min="0.01" step="0.01" required/></label>
      <label>Category<select name="category"><option>Materials</option><option>Travel</option><option>Other</option></select></label><label>Proposed allocation<select name="allocation"><option value="A">Project A</option><option value="B">Project B</option><option value="OVERHEAD">Company overhead</option></select></label>
      <label className="wide">Description<input name="description" required/></label><button className="primary wide">Record expense</button></fieldset>{!allowedExpense&&<p className="locked">Select Kevin to use this form.</p>}</form></div>
  </section>;
}

function Manager({ state, role, busy, action }: { state:AppState; role:string; busy:boolean; action:(w:()=>Promise<unknown>,m:string)=>Promise<void> }) {
  const manager = state.employees.find(e=>e.id===role)?.role==='manager';
  return <section className="panel"><div className="sectionHead"><div><p className="eyebrow">Manager queue</p><h2>Decisions for Svetlana</h2></div><span>{manager?'Authority active':'View only'}</span></div>
    <div className="queue"><h3>Pending sales</h3>{state.sales.filter(s=>s.status==='pending').map(s=><SaleDecision key={s.ref} sale={s} disabled={!manager||busy} role={role} action={action}/>)}{!state.sales.some(s=>s.status==='pending')&&<Empty text="No sales need approval."/>}
    <h3>Expenses awaiting allocation</h3>{state.expenses.filter(e=>e.status==='awaiting_allocation').map(e=><ExpenseDecision key={e.ref} expense={e} disabled={!manager||busy} role={role} action={action}/>)}{!state.expenses.some(e=>e.status==='awaiting_allocation')&&<Empty text="No expenses need allocation."/>}</div>
  </section>;
}

function SaleDecision({sale,disabled,role,action}:{sale:Sale;disabled:boolean;role:string;action:(w:()=>Promise<unknown>,m:string)=>Promise<void>}) {
  function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const f=new FormData(event.currentTarget);void action(()=>call(`/api/manager/sales/${sale.ref}/approve`,{actorId:role,richardPct:input(f,'r'),anastasiaPct:input(f,'a'),jeanClaudePct:input(f,'j')}),`${sale.ref} approved.`)}
  return <form className="decision" onSubmit={submit}><div><b>{sale.ref}</b><span>{sale.customer} · Project {sale.project}</span><small>{sale.description}</small></div><strong>{eur.format(sale.amount)}</strong><div className="miniSplit"><input name="r" type="number" defaultValue={sale.proposed_richard_pct}/><input name="a" type="number" defaultValue={sale.proposed_anastasia_pct}/><input name="j" type="number" defaultValue={sale.proposed_jean_claude_pct}/></div><button disabled={disabled}>Approve</button></form>;
}
function ExpenseDecision({expense,disabled,role,action}:{expense:Expense;disabled:boolean;role:string;action:(w:()=>Promise<unknown>,m:string)=>Promise<void>}) {
  function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const f=new FormData(event.currentTarget);void action(()=>call(`/api/manager/expenses/${expense.ref}/allocate`,{actorId:role,allocation:input(f,'allocation')}),`${expense.ref} allocated.`)}
  return <form className="decision" onSubmit={submit}><div><b>{expense.ref}</b><span>{expense.category} · proposed {expense.proposed_allocation}</span><small>{expense.description}</small></div><strong>{eur.format(expense.amount)}</strong><select name="allocation" defaultValue={expense.proposed_allocation}><option value="A">Project A</option><option value="B">Project B</option><option value="OVERHEAD">Overhead</option></select><button disabled={disabled}>Confirm</button></form>;
}

function Records({state,role,busy,action}:{state:AppState;role:string;busy:boolean;action:(w:()=>Promise<unknown>,m:string)=>Promise<void>}) { const manager=state.employees.find(e=>e.id===role)?.role==='manager'; const rows=useMemo(()=>[...state.sales.map(x=>({kind:'Sale',ref:x.ref,who:x.salesperson_id,detail:`${x.customer} · Project ${x.project}`,amount:x.amount,status:x.status,sync:x.sheet_sync_status,notification:x.notification_status})),...state.expenses.map(x=>({kind:'Expense',ref:x.ref,who:x.reporter_id,detail:`${x.category} · ${x.final_allocation??x.proposed_allocation}`,amount:x.amount,status:x.status,sync:x.sheet_sync_status,notification:x.notification_status}))].sort((a,b)=>b.ref.localeCompare(a.ref)),[state]); return <section className="panel"><div className="sectionHead"><div><p className="eyebrow">Audit trail</p><h2>Transaction records</h2></div><span>{rows.length} records</span></div><div className="tableWrap"><table><thead><tr><th>Ref</th><th>Type</th><th>Submitted by</th><th>Details</th><th>Amount</th><th>Status</th><th>Sheets</th><th>Telegram</th></tr></thead><tbody>{rows.map(r=><tr key={`${r.kind}-${r.ref}`}><td><b>{r.ref}</b></td><td>{r.kind}</td><td>{r.who}</td><td>{r.detail}</td><td>{eur.format(r.amount)}</td><td><span className="pill">{r.status.replaceAll('_',' ')}</span></td><td><span className={`sync ${r.sync}`}>{r.sync}</span>{r.sync==='failed'&&manager&&<button className="retry" disabled={busy} onClick={()=>void action(()=>call(`/api/sync/${r.kind==='Sale'?'sales':'expenses'}/${r.ref}`,{actorId:role}),`${r.ref} synchronized.`)}>Retry</button>}</td><td><span className={`sync ${r.notification==='failed'?'failed':r.notification==='sent'?'synced':'pending'}`}>{r.notification.replaceAll('_',' ')}</span></td></tr>)}</tbody></table></div></section> }

function SetupBlock({compact=false,state,role,busy=false,action}:{compact?:boolean;state?:AppState;role?:string;busy?:boolean;action?:(w:()=>Promise<unknown>,m:string)=>Promise<void>}) {
  const manager=state?.employees.find(e=>e.id===role)?.role==='manager';
  function link(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!action||!role)return;const f=new FormData(event.currentTarget);void action(()=>call('/api/employees/link-telegram',{actorId:role,employeeId:input(f,'employeeId'),telegramUserId:input(f,'telegramUserId'),telegramChatId:input(f,'telegramChatId')}),'Telegram account linked.');}
  function unlink(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!action||!role)return;const f=new FormData(event.currentTarget);void action(()=>call('/api/employees/unlink-telegram',{actorId:role,employeeId:input(f,'employeeId'),telegramUserId:input(f,'telegramUserId'),telegramChatId:input(f,'telegramChatId')}),'Matching reviewer Telegram link removed.');}
  return <section className={`panel setup ${compact?'compact':''}`}><div><p className="eyebrow">Connection checklist</p><h2>{compact?'Connect Supabase to load the app':'Finish the live connections'}</h2><p>The code is ready for credentials. Secrets belong in local and Vercel environment variables, never in GitHub.</p>
    {state&&<form className="linkForm" onSubmit={link}><h3>Manager Telegram setup</h3><p>Link a real Telegram sender to one fictional employee.</p><fieldset disabled={!manager||busy}><label>Employee<select name="employeeId">{state.employees.map(e=><option value={e.id} key={e.id}>{e.display_name}</option>)}</select></label><label>Telegram user ID<input name="telegramUserId" inputMode="numeric" required/></label><label>Telegram chat ID<input name="telegramChatId" inputMode="numeric" required/></label><button className="primary">Link account</button></fieldset>{!manager&&<p className="locked">Select Svetlana to manage Telegram links.</p>}</form>}
    {state&&<form className="linkForm" onSubmit={unlink}><h3>Safe reviewer cleanup</h3><p>Removes a test binding only when the employee, Telegram user ID and chat ID all match the current binding. It never guesses or removes a different account.</p><fieldset disabled={!manager||busy}><label>Fictional employee<select name="employeeId">{state.employees.map(e=><option value={e.id} key={e.id}>{e.display_name}</option>)}</select></label><label>Reviewer user ID<input name="telegramUserId" inputMode="numeric" required/></label><label>Reviewer chat ID<input name="telegramChatId" inputMode="numeric" required/></label><button className="primary">Remove exact matching link</button></fieldset></form>}
  </div><div><h3>Reviewer instructions</h3><ol><li><b>Select a fictional employee</b><span>Use Svetlana only for manager actions; employee views receive only their own permitted records from the server.</span></li><li><b>Test Telegram once</b><span>Send one unique sale or expense reference. One update is accepted once, even if Telegram retries delivery.</span></li><li><b>Make the decision</b><span>Approve or allocate it in the Manager tab and verify the single decision reply in Telegram.</span></li><li><b>Verify the ledger</b><span>Open the Viewer Google Sheet and compare the Sales or Expenses row.</span></li><li><b>Inspect dated evidence</b><span><a href="/api/reviewer-evidence?ref=S100505">Open the 5 Oct repair evidence</a> for receipt, duplicate-command and manager-decision status.</span></li><li><b>Clean up safely</b><span>Use the exact-match form at left with the same employee, user ID and chat ID. A mismatch removes nothing.</span></li></ol></div></section> }
function Empty({text}:{text:string}){return <p className="empty">{text}</p>}

const fallbackEmployees: Employee[] = [
  {id:'svetlana',display_name:'Svetlana de Monte Carlo',role:'manager',telegram_user_id:null,telegram_chat_id:null},
  {id:'richard',display_name:'Richard “Call Me Dick” Darling',role:'sales',telegram_user_id:null,telegram_chat_id:null},
  {id:'anastasia',display_name:'Anastasia Ferrari',role:'sales',telegram_user_id:null,telegram_chat_id:null},
  {id:'jean-claude',display_name:'Jean-Claude Bērziņš',role:'sales',telegram_user_id:null,telegram_chat_id:null},
  {id:'kevin',display_name:'Kevin von Whatever',role:'expense',telegram_user_id:null,telegram_chat_id:null},
];
