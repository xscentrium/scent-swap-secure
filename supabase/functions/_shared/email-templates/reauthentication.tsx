/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body,
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

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Xscentrium verification code</Preview>
    <Body style={brand.main}>
      <Container style={brand.container}>
        <Section style={brand.brandRow}>
          <Heading as="h2" style={brand.wordmark}>Xscentrium</Heading>
          <Text style={brand.tagline}>The art of scent, traded</Text>
        </Section>

        <Heading style={brand.h1}>Your verification code</Heading>
        <Text style={brand.text}>
          Use the code below to confirm this action. It expires shortly — never share it with anyone.
        </Text>

        <Text style={brand.code}>{token}</Text>

        <Hr style={brand.divider} />
        <Text style={brand.footer}>
          Didn't request this code? You can safely ignore this email.
        </Text>
        <Text style={brand.footerLegal}>
          © {new Date().getFullYear()} Xscentrium
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail
