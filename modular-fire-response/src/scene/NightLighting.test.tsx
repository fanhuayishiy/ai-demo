// @vitest-environment node
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { NightLighting } from './NightLighting';
import { Flame } from './Effects';
import { IncidentParticles } from './IncidentParticles';
import { incidentParticle } from './particlePaths';

type Props = { name?: string; children?: ReactNode; intensity?: number; castShadow?: boolean; color?: string; args?: unknown[]; opacity?: number; depthWrite?: boolean; emissiveIntensity?: number; kind?: string; count?: number };
function nodes(node: ReactNode): ReactElement<Props>[] {
  if(!isValidElement<Props>(node)) return [];
  return [node,...Children.toArray(node.props.children).flatMap(nodes)];
}
describe('bounded industrial night lighting',()=>{
  it('uses a cold-white key and neutral ground fill without extra shadow lights',()=>{
    const lights=nodes(NightLighting());
    const moon=lights.find(node=>node.props.name==='moon-key')!;
    const hemisphere=lights.find(node=>node.type==='hemisphereLight')!;
    const ambient=lights.find(node=>node.type==='ambientLight')!;
    expect(moon.props.color).toBe('#e2e9f0');
    expect(moon.props.intensity).toBeGreaterThan(1.3);
    expect(moon.props.intensity).toBeLessThanOrEqual(1.5);
    expect(hemisphere.props.args?.[1]).toBe('#292d31');
    expect(hemisphere.props.args?.[2]).toBeLessThanOrEqual(.55);
    const fill=lights.find(node=>node.type==='directionalLight'&&!node.props.castShadow)!;
    expect(fill.props.intensity).toBeLessThanOrEqual(.2);
    expect(ambient.props.intensity).toBeLessThan(.2);
    expect(lights.filter(node=>node.props.castShadow)).toHaveLength(1);
    expect(lights.filter(node=>typeof node.type==='string'&&node.type.endsWith('Light')).length).toBeLessThanOrEqual(5);
  });
  it('adds only one bounded warm incident light and a readable transparent plume',()=>{
    const frame=nodes(Flame({time:10,intensity:.8}));
    const lights=frame.filter(node=>node.type==='pointLight');
    expect(lights).toHaveLength(1);
    expect(lights[0].props.castShadow).not.toBe(true);
    expect(lights[0].props.color).toBe('#ffb168');
    expect(lights[0].props.intensity).toBeGreaterThan(50);
    expect(frame.some(node=>node.props.name==='incident-particles')).toBe(true);
    const particles=nodes(IncidentParticles({time:10,intensity:.8}));
    expect(particles.find(node=>node.props.kind==='smoke')?.props.count).toBe(24);
    expect(incidentParticle('smoke',10,5,.8).opacity).toBeGreaterThan(.27);
  });
  it('keeps incident lighting deterministic and scales it with the fire state',()=>{
    const light=(time:number,intensity:number)=>nodes(Flame({time,intensity})).find(node=>node.type==='pointLight')!.props.intensity!;
    expect(light(12,.8)).toBe(light(12,.8));
    expect(light(12,.4)).toBeLessThan(light(12,.8));
    expect(light(12,.8)).not.toBe(light(12.2,.8));
  });
});
