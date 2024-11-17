import { FC } from 'react'
import {
  AbsoluteCenter,
  Box,
  Center,
  Container,
  Flex,
  Grid,
  Heading,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import {
  BIG_CONTAINER_WIDTH,
  BLUE_GRADIENT,
  BORDER_RADIUS,
} from 'constants/constants'
import { AiOutlineFileImage, AiOutlineTeam } from 'react-icons/ai'
import { BiExport } from 'react-icons/bi'
import { BsShieldCheck } from 'react-icons/bs'
import { GoRows } from 'react-icons/go'

import { useStyle } from 'hooks/useStyle'

type Props = {
  param?: string
}

const USPs: FC<Props> = () => {
  const { bg } = useStyle()

  return (
    <Box bg={bg}>
      <Container maxWidth={BIG_CONTAINER_WIDTH} pb={32}>
        <Center mb={16} pt={32}>
          <Heading>Features</Heading>
        </Center>
        <Grid
          w='100%'
          gridTemplate={{
            base: 'repeat(1, 1fr) / repeat(1, 1fr)',
            md: 'repeat(1, 1fr) / repeat(2, 1fr)',
            lg: 'repeat(1, 1fr) / repeat(3, 1fr)',
          }}
          gap={4}
        >
          <FeatureCard
            icon={<AiOutlineTeam size={25} />}
            title='Collaborating Teams'
            description='Info'
          />
          <FeatureCard
            icon={<GoRows size={25} />}
            title='Protecting Data'
            description='Info'
          />
          <FeatureCard
            icon={<AiOutlineFileImage size={25} />}
            title='Best Ethical Practice'
            description='Info'
          />
          <FeatureCard
            icon={<BsShieldCheck size={25} />}
            title='Opening Science'
            description='Info'
          />
          <FeatureCard
            icon={<BiExport size={25} />}
            title='Mixing Methods'
            description='Info'
          />
          <FeatureCard
            icon={<AiOutlineTeam size={25} />}
            title='Semantic Toolset'
            description='Info'
          />
        </Grid>
      </Container>
    </Box>
  )
}

export default USPs

type FeatureCardProps = {
  icon: JSX.Element
  title: string
  description: string
}

const FeatureCard: FC<FeatureCardProps> = (p) => {
  const { bgSemiTransparent, bgMoreSemiTransparent } = useStyle()
  const bg = useColorModeValue('#ffffffe0', '#000000c0')

  return (
    <Flex
      borderWidth={1}
      bg={bgSemiTransparent}
      _hover={{
        bg: bgMoreSemiTransparent,
      }}
      borderRadius={BORDER_RADIUS}
      alignItems='center'
      flexDir='column'
      p={8}
      pt={10}
    >
      <Flex
        w={20}
        h={20}
        bgGradient={BLUE_GRADIENT}
        borderRadius='full'
        position='relative'
        p='1px'
        mb={8}
      >
        <Flex
          w='100%'
          h='100%'
          bgGradient={BLUE_GRADIENT}
          borderRadius='full'
          position='relative'
          bg={bg}
        >
          <AbsoluteCenter>{p.icon}</AbsoluteCenter>
        </Flex>
      </Flex>
      <Heading fontSize='2xl'>{p.title}</Heading>
      <Text opacity={0.6}>{p.description}</Text>
    </Flex>
  )
}
