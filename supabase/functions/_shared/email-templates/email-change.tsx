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

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({ siteName, oldEmail, newEmail, confirmationUrl }: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your new {siteName} email</Preview>
    <Body style={brand.main}>
      <Container style={brand.container}>
        <Section style={brand.brandRow}>
          <Heading as="h2" style={brand.wordmark}>{siteName}</Heading>
          <Text style={brand.tagline}>The art of scent, traded</Text>
        </Section>

        <Heading style={brand.h1}>Confirm your new email</Heading>
        <Text style={brand.text}>
          You requested to change the email on your {siteName} account from{' '}
          <Link href={`mailto:${oldEmail}`} style={brand.link}>{oldEmail}</Link> to{' '}
          <Link href={`mailto:${newEmail}`} style={brand.link}>{newEmail}</Link>. Confirm below to complete the change.
        </Text>

        <Button style={brand.button} href={confirmationUrl}>
          Confirm new email
        </Button>

        <Hr style={brand.divider} />
        <Text style={brand.footer}>
          Didn't request this? Secure your account immediately by resetting your password.
        </Text>
        <Text style={brand.footerLegal}>
          © {new Date().getFullYear()} {siteName}
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail
