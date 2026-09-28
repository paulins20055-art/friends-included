import test from "node:test";
import assert from "node:assert/strict";
import { calculateCommission, calculateDashboard, validateSplit } from "./business.ts";
import type { Expense, Sale } from "./types.ts";

const sale = (ref:string, amount:number, project:"A"|"B", split:[number,number,number], status:Sale["status"]="approved"):Sale => {
  const pool=amount*.1; return {ref,submitted_at:"2026-01-01",salesperson_id:"richard",telegram_chat_id:null,customer:"Test",project,description:"Test",amount,
    proposed_richard_pct:split[0],proposed_anastasia_pct:split[1],proposed_jean_claude_pct:split[2],approved_richard_pct:status==='approved'?split[0]:null,approved_anastasia_pct:status==='approved'?split[1]:null,approved_jean_claude_pct:status==='approved'?split[2]:null,
    commission_pool:status==='approved'?pool:0,commission_richard:status==='approved'?pool*split[0]/100:0,commission_anastasia:status==='approved'?pool*split[1]/100:0,commission_jean_claude:status==='approved'?pool*split[2]/100:0,status,sheet_sync_status:"synced",sheet_sync_error:null,notification_status:"sent",notification_error:null,approved_at:null};
};
const expense=(ref:string,amount:number,allocation:Expense["final_allocation"],status:Expense["status"]="allocated"):Expense=>({ref,submitted_at:"2026-01-01",reporter_id:"kevin",telegram_chat_id:null,description:"Test",category:"Other",amount,proposed_allocation:allocation??"A",final_allocation:allocation,status,sheet_sync_status:"synced",sheet_sync_error:null,notification_status:"sent",notification_error:null,approved_at:null});

test("calculates the example commission split",()=>assert.deepEqual(calculateCommission(1000,[50,30,20]),{pool:100,amounts:[50,30,20]}));
test("assigns a cent-rounding difference without changing the pool",()=>assert.equal(calculateCommission(10.01,[50,50,0]).amounts.reduce((a,b)=>a+b,0),1));
test("rejects a split that is not 100%",()=>assert.throws(()=>validateSplit([60,30,20]),/100%/));
test("matches Test 1 control totals",()=>{
  const sales=[sale("S01",1000,"A",[50,30,20]),sale("S02",2000,"B",[20,40,40])];
  const expenses=[expense("E01",120,"A"),expense("E02",80,"A"),expense("E03",100,"OVERHEAD")];
  const actual=calculateDashboard(sales,expenses);
  assert.equal(actual.projectA.result,700); assert.equal(actual.projectB.result,1800); assert.equal(actual.company.result,2400);
  assert.deepEqual(actual.commissions,{richard:90,anastasia:110,jeanClaude:100,total:300});
});
test("matches cumulative Test 2 control totals",()=>{
  const sales=[sale("S01",1000,"A",[50,30,20]),sale("S02",2000,"B",[20,40,40]),sale("S03",1500,"A",[20,30,50]),sale("S04",800,"B",[25,25,50]),sale("S05",600,"B",[100,0,0],"pending")];
  const expenses=[expense("E01",120,"A"),expense("E02",80,"A"),expense("E03",100,"OVERHEAD"),expense("E04",250,"B"),expense("E05",90,"B"),expense("E06",60,"OVERHEAD"),expense("E07",140,null,"awaiting_allocation")];
  const actual=calculateDashboard(sales,expenses);
  assert.equal(actual.projectA.result,2050); assert.equal(actual.projectB.result,2180); assert.equal(actual.company.result,3930);
  assert.equal(actual.company.overhead,160); assert.equal(actual.company.awaiting,140);
  assert.deepEqual(actual.commissions,{richard:140,anastasia:175,jeanClaude:215,total:530});
});
