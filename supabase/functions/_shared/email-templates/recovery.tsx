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
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import { brand } from './_brand.ts'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your {siteName} password</Preview>
    <Body style={brand.main}>
      <Container style={brand.container}>
        <Section style={brand.brandRow}>
          <Heading as="h2" style={brand.wordmark}>{siteName}</Heading>
          <Text style={brand.tagline}>The art of scent, traded</Text>
        </Section>

        <Heading style={brand.h1}>Reset your password</Heading>
        <Text style={brand.text}>
          We received a request to reset your password. Choose a new one using the secure link below.
          The link expires in one hour.
        </Text>

        <Button style={brand.button} href={confirmationUrl}>
          Reset password
        </Button>

        <Hr style={brand.divider} />
        <Text style={brand.footer}>
          Didn't request this? You can safely ignore this email — your password won't change.
        </Text>
        <Text style={brand.footerLegal}>
          © {new Date().getFullYear()} {siteName} · Curated · Escrow Protected
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail
