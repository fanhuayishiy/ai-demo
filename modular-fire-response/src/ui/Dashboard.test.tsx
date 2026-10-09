import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import type { SimulationState } from '../types';
import type { DashboardProps } from './types';
afterEach(cleanup);
function props(): DashboardProps {
 const state: SimulationState = {time:24,playing:true,speed:1,mode:'guided',phase:1,complete:false,
 units:[{id:'water-01',name:'供水运输车 01',kind:'water',station:'NORTH',position:[0,0,0],home:[0,0,0],destination:[0,0,0],battery:90,water:800,capacity:800,status:'enroute',task:'前往集结区',route:[],travel:0,deployment:0}],
 water:{buffer:1400,capacity:1800,inflow:0,outflow:0,totalUsed:0,interruptedFor:0,connected:false,sourceAvailable:true,refillCycles:0},
 flags:{blockedRoad:false,lowWater:false,droneFault:false,powerFault:false,airConcept:true,liftConcept:false},
 approvals:{dispatch:true,connection:false,rescue:false,lift:false},life:{detected:true,confirmed:false,rescued:0,source:'可见光与热成像'},events:[],metrics:{firstRecon:12,firstArrival:null,delivered:0,energySwaps:0}};
 return {state,command:vi.fn(),selectedId:'incident',select:vi.fn(),view:'overview',setView:vi.fn(),camera:vi.fn(),touring:false,setTouring:vi.fn(),contextLost:false};
}
describe('dashboard controls',()=>{
 it('pauses the shared simulation',()=>{const p=props();render(<Dashboard {...p}/>);fireEvent.click(screen.getByRole('button',{name:'暂停演示'}));expect(p.command).toHaveBeenCalledWith({type:'toggle-play'});});
 it('selects a searched vehicle',()=>{const p=props();render(<Dashboard {...p}/>);fireEvent.change(screen.getByRole('searchbox'),{target:{value:'供水'}});fireEvent.click(screen.getByRole('option',{name:/供水运输车 01/}));expect(p.select).toHaveBeenCalledWith('water-01');});
 it('switches view without restarting the task',()=>{const p=props();render(<Dashboard {...p}/>);fireEvent.click(screen.getByRole('tab',{name:'现场跟随'}));expect(p.setView).toHaveBeenCalledWith('follow');expect(p.command).not.toHaveBeenCalled();});
 it('exposes manual connection authorization',()=>{const p=props();p.state.mode='command';render(<Dashboard {...p}/>);fireEvent.click(screen.getByRole('button',{name:'确认供水连接'}));expect(p.command).toHaveBeenCalledWith({type:'approve',key:'connection'});});
 it('resets the task explicitly',()=>{const p=props();render(<Dashboard {...p}/>);fireEvent.click(screen.getByRole('button',{name:'重新演示'}));expect(p.command).toHaveBeenCalledWith({type:'reset'});});
 it('shows a context loss status while retaining commands',()=>{const p=props();p.contextLost=true;render(<Dashboard {...p}/>);expect(screen.getByRole('alert').textContent).toContain('图形');expect(screen.getByRole('button',{name:'暂停演示'})).toBeTruthy();});
 it('identifies night response and derives equipment classes from the fleet',()=>{const p=props();render(<Dashboard {...p}/>);expect(screen.getByText(/夜间行动/)).toBeTruthy();expect(screen.getByText(/1 类装备/)).toBeTruthy();});
 it('describes the mobile supply hub instead of a fixed pump',()=>{const p=props();p.selectedId='water-node';render(<Dashboard {...p}/>);expect(screen.getByRole('heading',{name:'移动供水枢纽'})).toBeTruthy();expect(screen.queryByText(/固定泵组/)).toBeNull();});
});
