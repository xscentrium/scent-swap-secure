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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ siteName, siteUrl, recipient, confirmationUrl }: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to {siteName} — confirm your email to start trading</Preview>
    <Body style={brand.main}>
      <Container style={brand.container}>
        <Section style={brand.brandRow}>
          <Heading as="h2" style={brand.wordmark}>{siteName}</Heading>
          <Text style={brand.tagline}>The art of scent, traded</Text>
        </Section>

        <Heading style={brand.h1}>Welcome to the collection</Heading>
        <Text style={brand.text}>
          Thanks for joining <Link href={siteUrl} style={brand.link}>{siteName}</Link>. Confirm your email
          ({recipient}) to unlock the marketplace, start your collection, and trade with verified collectors.
        </Text>

        <Button style={brand.button} href={confirmationUrl}>
          Confirm email
        </Button>

        <Hr style={brand.divider} />
        <Text style={brand.footer}>
          You're one step away. Once confirmed, complete your profile and ID verification to unlock trading
          and our 50% escrow protection.
        </Text>
        <Text style={brand.footer}>
          Didn't sign up? You can safely ignore this email.
        </Text>
        <Text style={brand.footerLegal}>
          © {new Date().getFullYear()} {siteName} · Curated · Escrow Protected
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
