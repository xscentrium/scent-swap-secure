/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import { brand } from './_brand.ts'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to join {siteName}</Preview>
    <Body style={brand.main}>
      <Container style={brand.container}>
        <Section style={brand.brandRow}>
          <Heading as="h2" style={brand.wordmark}>{siteName}</Heading>
          <Text style={brand.tagline}>The art of scent, traded</Text>
        </Section>

        <Heading style={brand.h1}>You're invited</Heading>
        <Text style={brand.text}>
          You've been invited to join <Link href={siteUrl} style={brand.link}>{siteName}</Link> — a
          members-only marketplace for collectors of rare colognes, perfumes, and oils. Accept below to
          create your account.
        </Text>

        <Button style={brand.button} href={confirmationUrl}>
          Accept invitation
        </Button>

        <Hr style={brand.divider} />
        <Text style={brand.footer}>
          Not expecting an invite? You can safely ignore this email.
        </Text>
        <Text style={brand.footerLegal}>
          © {new Date().getFullYear()} {siteName}
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail
