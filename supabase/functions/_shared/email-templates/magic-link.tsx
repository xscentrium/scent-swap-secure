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

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your {siteName} login link</Preview>
    <Body style={brand.main}>
      <Container style={brand.container}>
        <Section style={brand.brandRow}>
          <Heading as="h2" style={brand.wordmark}>{siteName}</Heading>
          <Text style={brand.tagline}>The art of scent, traded</Text>
        </Section>

        <Heading style={brand.h1}>Your secure login link</Heading>
        <Text style={brand.text}>
          Click below to sign in. The link is single-use and expires shortly — keep it private.
        </Text>

        <Button style={brand.button} href={confirmationUrl}>
          Sign in
        </Button>

        <Hr style={brand.divider} />
        <Text style={brand.footer}>
          Didn't request this link? You can safely ignore this email.
        </Text>
        <Text style={brand.footerLegal}>
          © {new Date().getFullYear()} {siteName}
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail
