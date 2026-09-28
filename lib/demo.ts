import type { Employee, Expense, Sale } from "./types.ts";

export const demoEmployees: Employee[] = [
  { id: "svetlana", display_name: "Svetlana de Monte Carlo", role: "manager", telegram_user_id: null, telegram_chat_id: null },
  { id: "richard", display_name: "Richard “Call Me Dick” Darling", role: "sales", telegram_user_id: null, telegram_chat_id: null },
  { id: "anastasia", display_name: "Anastasia Ferrari", role: "sales", telegram_user_id: null, telegram_chat_id: null },
  { id: "jean-claude", display_name: "Jean-Claude Bērziņš", role: "sales", telegram_user_id: null, telegram_chat_id: null },
  { id: "kevin", display_name: "Kevin von Whatever", role: "expense", telegram_user_id: null, telegram_chat_id: null },
];

export const demoSales: Sale[] = [
  { ref:"S01",submitted_at:"2026-09-28T09:00:00Z",salesperson_id:"richard",telegram_chat_id:null,customer:"Olivia Rose",project:"A",description:"One proud uncle and an emotional grandmother",amount:1000,proposed_richard_pct:50,proposed_anastasia_pct:30,proposed_jean_claude_pct:20,approved_richard_pct:50,approved_anastasia_pct:30,approved_jean_claude_pct:20,commission_pool:100,commission_richard:50,commission_anastasia:30,commission_jean_claude:20,status:"approved",sheet_sync_status:"synced",sheet_sync_error:null,notification_status:"sent",notification_error:null,approved_at:"2026-09-28T09:30:00Z" },
  { ref:"S02",submitted_at:"2026-09-28T09:10:00Z",salesperson_id:"anastasia",telegram_chat_id:null,customer:"Daniel King",project:"B",description:"University friends, dancing, and the stripping performance",amount:2000,proposed_richard_pct:0,proposed_anastasia_pct:50,proposed_jean_claude_pct:50,approved_richard_pct:20,approved_anastasia_pct:40,approved_jean_claude_pct:40,commission_pool:200,commission_richard:40,commission_anastasia:80,commission_jean_claude:80,status:"approved",sheet_sync_status:"synced",sheet_sync_error:null,notification_status:"not_required",notification_error:null,approved_at:"2026-09-28T09:32:00Z" },
];

export const demoExpenses: Expense[] = [
  { ref:"E01",submitted_at:"2026-09-28T09:15:00Z",reporter_id:"kevin",telegram_chat_id:null,description:"Rented suit and fake pearl necklace",category:"Materials",amount:120,proposed_allocation:"A",final_allocation:"A",status:"allocated",sheet_sync_status:"synced",sheet_sync_error:null,notification_status:"sent",notification_error:null,approved_at:"2026-09-28T09:35:00Z" },
  { ref:"E02",submitted_at:"2026-09-28T09:20:00Z",reporter_id:"kevin",telegram_chat_id:null,description:"Taxi for the grandmother",category:"Travel",amount:80,proposed_allocation:"B",final_allocation:"A",status:"allocated",sheet_sync_status:"synced",sheet_sync_error:null,notification_status:"not_required",notification_error:null,approved_at:"2026-09-28T09:36:00Z" },
  { ref:"E03",submitted_at:"2026-09-28T09:22:00Z",reporter_id:"kevin",telegram_chat_id:null,description:"Monthly company website subscription",category:"Other",amount:100,proposed_allocation:"OVERHEAD",final_allocation:"OVERHEAD",status:"allocated",sheet_sync_status:"synced",sheet_sync_error:null,notification_status:"not_required",notification_error:null,approved_at:"2026-09-28T09:22:00Z" },
];
