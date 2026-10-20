// =============================================================================
// Template tests — placeholder ↔ arg closure, html escaping, and the catalog
// invariants a product's config leans on at load time.
// =============================================================================

import { describe, it, expect } from "vitest";
import { defineMessageTypes } from "./message-types";
import {
  defineEmailTemplate,
  defineInAppTemplate,
  defineSmsTemplate,
  renderEmailTemplate,
  renderInAppTemplate,
  renderSmsTemplate,
  validateTemplates,
  type AnyTemplateRef,
} from "./templates";

const messageTypes = defineMessageTypes({
  system: { userPref: false },
  organization: { userPref: true },
});

const welcomeEmail = defineEmailTemplate({
  name: "welcome",
  type: "system",
  args: { name: "string", url: "string" },
  subject: "Welcome, {{name}}",
  text: "Welcome, {{name}}. Start here: {{url}}",
  html: '<p>Welcome, {{name}}.</p><p><a href="{{url}}">Start here</a></p>',
});

const codeSms = defineSmsTemplate({
  name: "code",
  type: "system",
  args: { code: "string" },
  body: "Your code is {{code}}.",
});

const joinedInApp = defineInAppTemplate({
  name: "joined",
  type: "organization",
  args: { who: "string" },
  title: "New member",
  body: "{{who}} joined.",
});

describe("rendering", () => {
  it("interpolates every channel's bodies", () => {
    expect(
      renderEmailTemplate(welcomeEmail, { name: "Ada", url: "https://x.test" }),
    ).toEqual({
      subject: "Welcome, Ada",
      text: "Welcome, Ada. Start here: https://x.test",
      html: '<p>Welcome, Ada.</p><p><a href="https://x.test">Start here</a></p>',
    });
    expect(renderSmsTemplate(codeSms, { code: "123456" })).toEqual({
      body: "Your code is 123456.",
    });
    expect(renderInAppTemplate(joinedInApp, { who: "Ada" })).toEqual({
      title: "New member",
      body: "Ada joined.",
    });
  });

  it("escapes interpolated values in html but not in text", () => {
    const rendered = renderEmailTemplate(welcomeEmail, {
      name: '<script>alert("x")</script>',
      url: "https://x.test?a=1&b=2",
    });
    expect(rendered.html).toContain("&lt;script&gt;");
    expect(rendered.html).toContain("https://x.test?a=1&amp;b=2");
    expect(rendered.text).toContain("<script>");
    expect(rendered.subject).toContain("<script>");
  });
});

describe("validateTemplates", () => {
  it("accepts a closed catalog", () => {
    expect(() =>
      validateTemplates([welcomeEmail, codeSms, joinedInApp], messageTypes),
    ).not.toThrow();
  });

  it("rejects a placeholder that is not a declared arg", () => {
    const broken = defineSmsTemplate({
      name: "broken",
      type: "system",
      args: { code: "string" },
      body: "Your code is {{code}}, {{name}}.",
    });
    expect(() => validateTemplates([broken], messageTypes)).toThrow(
      /uses \{\{name\}\}/,
    );
  });

  it("rejects an arg no body uses", () => {
    const broken = defineSmsTemplate({
      name: "broken",
      type: "system",
      args: { code: "string", unused: "string" },
      body: "Your code is {{code}}.",
    });
    expect(() => validateTemplates([broken], messageTypes)).toThrow(
      /declares arg "unused"/,
    );
  });

  it("rejects a message type that is not in the registry", () => {
    const broken = defineSmsTemplate({
      name: "broken",
      type: "marketing",
      args: { code: "string" },
      body: "Your code is {{code}}.",
    });
    expect(() => validateTemplates([broken], messageTypes)).toThrow(
      /not in the registry/,
    );
  });

  it("rejects two templates with the same channel and name", () => {
    const duplicates: AnyTemplateRef[] = [codeSms, { ...codeSms }];
    expect(() => validateTemplates(duplicates, messageTypes)).toThrow(
      /declared twice/,
    );
  });

  it("allows the same name on two different channels", () => {
    const sameNameEmail = defineEmailTemplate({
      name: "code",
      type: "system",
      args: { code: "string" },
      subject: "Your code",
      text: "Your code is {{code}}.",
      html: "<p>Your code is {{code}}.</p>",
    });
    expect(() =>
      validateTemplates([codeSms, sameNameEmail], messageTypes),
    ).not.toThrow();
  });
});
