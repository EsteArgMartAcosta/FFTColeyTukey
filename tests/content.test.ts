import {test} from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import {proofEntries} from '../src/proofs.ts';
import {chapters,references,defenseQuestions} from '../src/content.ts';

test('every academic equation renders in strict KaTeX',()=>{
 let count=0;
 const texts=[...chapters.flatMap(c=>[c.title,c.subtitle,c.question,c.body]),...defenseQuestions.flatMap(q=>[q.question,q.answer])];
 for(const text of texts){
  for(const m of text.matchAll(/\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/g)){
   assert.ok(!(m[1]??m[2]).includes('<'),'Use \u005c\u005clt in HTML-bound math to prevent HTML parsing from truncating equations');
   katex.renderToString(m[1]??m[2],{throwOnError:true,strict:'error'});count++;
  }
 }
 assert.ok(count>150,`Only ${count} equations found`);
});
test('chapter identity, lecture timing and reference destinations are coherent',()=>{
 assert.equal(new Set(chapters.map(c=>c.id)).size,9);
 assert.equal(chapters.reduce((sum,c)=>sum+c.minutes,0),55);
 for(const q of defenseQuestions)assert.ok(chapters.some(c=>c.id===q.chapter));
 for(const r of references)assert.equal(new URL(r.url).protocol,'https:');
});

test('every full derivation has a unique identity, valid chapter and resolvable primary references',()=>{
 assert.equal(new Set(proofEntries.map(p=>p.id)).size,16);
 for(const p of proofEntries){
  assert.ok(chapters.some(c=>c.id===p.chapter),p.id);
  for(const ref of p.refs)assert.ok(references.some(r=>r.id===ref),`${p.id}: ${ref}`);
 }
});
