import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  Image,
  Link,
  SimpleGrid,
  Stack,
  Text,
  Card,
  VStack,
  Accordion,
  Span,
  Field,
  Input
} from '@chakra-ui/react'
import { FiArrowRight, FiCheckCircle, FiMoon, FiSun } from 'react-icons/fi'
import logo from './assets/logo.svg'
import { useState } from 'react'
import car3 from './assets/car3.svg'
import chill from './assets/chill.svg'
import docs from './assets/docs.svg'
import works from './assets/works.svg'
import { FaCircleQuestion } from 'react-icons/fa6'
import { LuSquareCheckBig } from 'react-icons/lu'


const items = [
  { value: "a", title: "De ce as avea nevoie de o platforma ca aceasta", text: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Distinctio ipsa ducimus, ipsam pariatur hic possimus aliquam eaque similique nostrum! Vero veniam earum sint sapiente ut. Quae aspernatur assumenda aliquam pariatur suscipit in porro ipsam. Molestias doloremque ipsa hic sapiente, blanditiis nam mollitia laudantium incidunt sint totam, esse consequatur amet corporis." },
  { value: "b", title: "Daca am deja PFA, pot sa folosesc platforma?", text: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Distinctio ipsa ducimus, ipsam pariatur hic possimus aliquam eaque similique nostrum! Vero veniam earum sint sapiente ut. Quae aspernatur assumenda aliquam pariatur suscipit in porro ipsam. Molestias doloremque ipsa hic sapiente, blanditiis nam mollitia laudantium incidunt sint totam, esse consequatur amet corporis." },
  { value: "c", title: "De ce documente am nevoie?", text: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Distinctio ipsa ducimus, ipsam pariatur hic possimus aliquam eaque similique nostrum! Vero veniam earum sint sapiente ut. Quae aspernatur assumenda aliquam pariatur suscipit in porro ipsam. Molestias doloremque ipsa hic sapiente, blanditiis nam mollitia laudantium incidunt sint totam, esse consequatur amet corporis." },
]

function App() {
  const GROSS_SALARY = 4050;
  const UBER_BOLT_ANNUAL_INCOME_NORM = 49005;
  const roundToInt = (value: number) => Math.round(value)
  const[anualIncome, setAnualIncome] = useState(0)
  const[deductibleExpenses, setDeductibleExpenses] = useState(0)
  const[realIncomeTax, setRealIncomeTax] = useState(0)
  const[realCAS, setRealCAS] = useState(0)
  const[realCASS, setRealCASS] = useState(0)
  const[normIncomeTax, setNormIncomeTax] = useState(0)
  const[normCAS, setNormCAS] = useState(0)
  const[normCASS, setNormCASS] = useState(0)
  const[netIncomeRealSystem, setNetIncomeRealSystem] = useState(0)
  const[netIncomeNormaSystem, setNetIncomeNormaSystem] = useState(0)
  const computeTaxes = () => {

    const netIncome = anualIncome - deductibleExpenses
    let CAS = 0;
    let CASS = 0;
    let incomeTax = 0;
    let netIncomeAfterTaxes = 0;
    if(netIncome < GROSS_SALARY * 12) {
      CAS = 0;
    }
    else if(netIncome >= GROSS_SALARY * 12 && netIncome < GROSS_SALARY * 24)
    {
      CAS = 0.25 * (GROSS_SALARY * 12);
    }
    else if(netIncome >= GROSS_SALARY * 24) CAS = 0.25 * (GROSS_SALARY * 24);
    if(netIncome <= 0) CASS = 0
    else if(netIncome > 0 && netIncome < GROSS_SALARY * 6) CASS = 0.1 * (GROSS_SALARY * 6)
    else if(netIncome >= GROSS_SALARY * 6 && netIncome < GROSS_SALARY * 72) CASS = 0.1 * netIncome
    else if(netIncome >= GROSS_SALARY * 72) CASS = 0.1 * GROSS_SALARY * 72
    incomeTax = 0.1 * Math.max(0, (netIncome - CAS - CASS))
    netIncomeAfterTaxes = netIncome - CAS - CASS - incomeTax
    setRealCAS(roundToInt(CAS))
    setRealCASS(roundToInt(CASS))
    setRealIncomeTax(roundToInt(incomeTax))
    setNetIncomeRealSystem(roundToInt(netIncomeAfterTaxes))
    if(UBER_BOLT_ANNUAL_INCOME_NORM < GROSS_SALARY * 12) {
      CAS = 0;
    }
    else if(UBER_BOLT_ANNUAL_INCOME_NORM >= GROSS_SALARY * 12 && UBER_BOLT_ANNUAL_INCOME_NORM < GROSS_SALARY * 24)
    {
      CAS = 0.25 * (GROSS_SALARY * 12);
    }
    else if(UBER_BOLT_ANNUAL_INCOME_NORM >= GROSS_SALARY * 24) CAS = 0.25 * (GROSS_SALARY * 24);
    if(UBER_BOLT_ANNUAL_INCOME_NORM <= 0) CASS = 0
    else if(UBER_BOLT_ANNUAL_INCOME_NORM > 0 && UBER_BOLT_ANNUAL_INCOME_NORM < GROSS_SALARY * 6) CASS = 0.1 * (GROSS_SALARY * 6)
    else if(UBER_BOLT_ANNUAL_INCOME_NORM >= GROSS_SALARY * 6 && UBER_BOLT_ANNUAL_INCOME_NORM < GROSS_SALARY * 72) CASS = 0.1 * UBER_BOLT_ANNUAL_INCOME_NORM
    else if(UBER_BOLT_ANNUAL_INCOME_NORM >= GROSS_SALARY * 72) CASS = 0.1 * GROSS_SALARY * 72
    incomeTax = 0.1 * Math.max(0, (UBER_BOLT_ANNUAL_INCOME_NORM - CAS - CASS))
    netIncomeAfterTaxes = anualIncome - CAS - CASS - incomeTax
    setNormCAS(roundToInt(CAS))
    setNormCASS(roundToInt(CASS))
    setNormIncomeTax(roundToInt(incomeTax))
    setNetIncomeNormaSystem(roundToInt(netIncomeAfterTaxes))
  }

  return (
    <>
    <Flex
      as="header"
      position="sticky"
      top="0"
      zIndex="100"
      alignItems="center"
      padding="4"
      style={{"backgroundColor": "#DCF763"}}
      justifyContent="space-between"
      flexWrap={{ base: "wrap", md: "nowrap" }}
      gap={{ base: "3", md: "0" }}
    >
      <Button variant="plain" padding="0" minWidth="0" _hover={{'transform': 'translateY(-2px)'}} >
        <Image
          src={logo}
          alt="Ridelance Logo"
          width={{ base: "150px", md: "200px" }}
          height={{ base: "38px", md: "50px" }}
          fit="contain"
        />
      </Button>
      <Flex
        alignItems='center'
        gap={{ base: "2", md: "4" }}
        flex={{ base: "none", md: "1" }}
        justifyContent="center"
        flexWrap={{ base: "wrap", md: "nowrap" }}
        width={{ base: "100%", md: "auto" }}
        order={{ base: 3, md: 0 }}
      >
        <Link fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>
            Despre Noi
        </Link>
        <Link fontWeight="semibold" fontSize={{ base: "sm", md: "md" }}>
          Intrebari Frecvente
        </Link>
        <Link fontWeight="semibold" fontSize={{ base: "sm", md: "md" }}>
            Calculator Taxe
        </Link>
        <Link fontWeight="semibold" fontSize={{ base: "sm", md: "md" }}>
            Contact
        </Link>
      </Flex>
      <Button size={{ base: "xs", md: "sm" }} borderRadius="12px" fontSize="15px" fontWeight="bold">
        Demo
      </Button>
    </Flex>
    <Flex
      style={{"backgroundColor":"#435058"}}
      padding={{ base: "6", md: "12" }}
      alignItems="center"
      direction={{ base: "column", md: "row" }}
      gap={{ base: "6", md: "0" }}
    >
      <Flex
        maxW={{ base: "100%", md: "50%" }}
        padding={{ base: "0", md: "24" }}
        flex="1"
        textAlign={{ base: "center", md: "left" }}
        gap="5"
        flexDirection="column"
        alignItems={{ base: "center", md: "flex-start" }}
      >
        <Text textStyle="4xl" fontWeight="bold" fontSize={{ base: "3xl", md: "4xl" }}>
          Despre Noi
        </Text>
        <Text textStyle="xl" fontWeight="semibold" fontSize={{ base: "md", md: "xl" }}>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Corrupti recusandae neque nobis tempore nihil eveniet dicta quo. Ratione architecto, voluptatum molestiae maiores praesentium consequuntur distinctio facilis nihil optio a eveniet atque, officiis, voluptates laborum laudantium veritatis porro labore? Ipsam illo repellat dolorum est omnis nobis doloremque sit sapiente quod excepturi.
        </Text>
        <HStack
          flexDirection={{ base: "column", sm: "row" }}
          width={{ base: "100%", sm: "auto" }}
          alignItems="stretch"
        >
            <Button width={{ base: "100%", sm: "auto" }} fontSize="15px" fontWeight="bold" borderRadius="8px">Inregistreaza-te</Button>
            <Button width={{ base: "100%", sm: "auto" }} fontSize="15px" fontWeight="bold" borderRadius="8px" variant="outline">Afla mai multe</Button>
        </HStack>

      </Flex>
      <Box maxW={{ base: "100%", md: "50%" }} alignItems="center" justifyContent="center" display="flex" flex="1" width="100%">
        <Image src={car3} width={{ base: "85%", md: "65%" }} height="auto" alt="Car Image" />
      </Box>
    </Flex>
    <Flex style={{"backgroundColor":"#848C8E"}} padding={{ base: "6", md: "24" }} alignItems="stretch" justifyContent="center" gap={{ base: "4", md: "6" }} flexWrap="wrap">
      <Card.Root width={{ base: "100%", md: "30%" }} minH="340px" display="flex" flexDirection="column" bg="#0000006e" borderRadius="15px" border="none" borderColor="transparent">
        <Card.Header textAlign="center" pb="2">
          <Text fontSize="xl" fontWeight="bold">
            Cum functioneaza
          </Text>
        </Card.Header >
        <Card.Body flex="1" pt="1" pb="5">
          <Text>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </Text>
          <Box alignContent="center" justifyContent="center" display="flex" mt="4">
            <Image
              src={works}
              alt="Cum functioneaza"
              boxSize={{ base: "120px", md: "150px" }}
              objectFit="contain"
            />
          </Box>

        </Card.Body>
        <Card.Footer />
      </Card.Root>
      <Card.Root width={{ base: "100%", md: "30%" }} minH="340px" display="flex" flexDirection="column" bg="#0000006e" borderRadius="15px" border="none" borderColor="transparent">
        <Card.Header textAlign="center" pb="2">
          <Text fontSize="xl" fontWeight="bold">
            Doar trimite documentele necesare
          </Text>
        </Card.Header >
        <Card.Body flex="1" pt="1" pb="5">
          <Text>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </Text>
          <Box alignContent="center" justifyContent="center" display="flex" mt="4">
            <Image
              src={docs}
              alt="Documente"
              boxSize={{ base: "120px", md: "150px" }}
              objectFit="contain"
            />
          </Box>

        </Card.Body>
        <Card.Footer />
      </Card.Root>
      <Card.Root width={{ base: "100%", md: "30%" }} minH="340px" display="flex" flexDirection="column" bg="#0000006e" borderRadius="15px" border="none" borderColor="transparent">
        <Card.Header textAlign="center" pb="2">  
          <Text fontSize="xl" fontWeight="bold">
            Fara stres, fara batai de cap
          </Text>
        </Card.Header >
        <Card.Body flex="1" pt="1" pb="5">
          <Text>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </Text>
          <Box alignContent="center" justifyContent="center" display="flex" mt="4">
            <Image
              src={chill}
              alt="Fara stres"
              boxSize={{ base: "120px", md: "150px" }}
              objectFit="contain"
            />
          </Box>
        </Card.Body>
        <Card.Footer />
      </Card.Root>
    </Flex>
    <Flex style={{"backgroundColor":"#BFB7B6"}} padding={{ base: "6", md: "24" }} textAlign="center" alignItems="center" justifyContent="center" flexDirection="column" gap="5">
      <Text fontSize={{ base: "2xl", md: "4xl" }} fontWeight="bold">
        Ce primesti daca alegi sa lucrezi cu noi
      </Text>
      <Box>
        <HStack gap={{ base: "8", md: "20" }} alignItems="flex-start" justifyContent="center" flexWrap="wrap">
          <VStack gap="5">
            <HStack alignItems="flex-start">
              <LuSquareCheckBig />
              <Text fontWeight="semibold" fontSize={{ base: "md", md: "lg" }} textAlign="left">Lorem ipsum dolor sit amet consectetur adipisicing elit. Molestias, odio?</Text>
            </HStack>
                        <HStack alignItems="flex-start">
              <LuSquareCheckBig />
              <Text fontWeight="semibold" fontSize={{ base: "md", md: "lg" }} textAlign="left">Lorem ipsum dolor sit amet consectetur adipisicing elit. Molestias, odio?</Text>
            </HStack>
                        <HStack alignItems="flex-start">
              <LuSquareCheckBig />
              <Text fontWeight="semibold" fontSize={{ base: "md", md: "lg" }} textAlign="left">Lorem ipsum dolor sit amet consectetur adipisicing elit. Molestias, odio?</Text>
            </HStack>
          </VStack>
          <VStack gap="5">
            <HStack alignItems="flex-start">
              <LuSquareCheckBig />
              <Text fontWeight="semibold" fontSize={{ base: "md", md: "lg" }} textAlign="left">Lorem ipsum dolor sit amet consectetur adipisicing elit. Molestias, odio?</Text>
            </HStack>
            <HStack alignItems="flex-start">
              <LuSquareCheckBig />
              <Text fontWeight="semibold" fontSize={{ base: "md", md: "lg" }} textAlign="left">Lorem ipsum dolor sit amet consectetur adipisicing elit. Molestias, odio?</Text>
            </HStack>
            <HStack alignItems="flex-start">
              <LuSquareCheckBig />
              <Text fontWeight="semibold" fontSize={{ base: "md", md: "lg" }} textAlign="left">Lorem ipsum dolor sit amet consectetur adipisicing elit. Molestias, odio?</Text>
            </HStack>
          </VStack>
        </HStack>
      </Box>
    </Flex>
    <Flex padding={{ base: "6", md: "24" }} alignContent="center" style={{"backgroundColor":"#435058"}} justifyContent="center" flexDirection="column" textAlign="center">
      <Text fontSize={{ base: "2xl", md: "4xl" }} fontWeight="bold" >
        Intrebari Frecvente
      </Text>
      <Accordion.Root collapsible defaultValue={["a"]} variant="enclosed" borderRadius="20px" marginTop={{ base: "6", md: "10" }} bg="#0000006e" border="none" borderColor="transparent">
      {items.map((item, index) => (
        <Accordion.Item key={index} value={item.value}>
          <Accordion.ItemTrigger
          padding={{ base: "4", md: "5" }}
          _open={{ bg: "#DCF763", color: "#1A1A1A" }}
          transition="background 0.2s ease"
          >
            <Span flex="1">{item.title}</Span>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Accordion.ItemBody textAlign="left">{item.text}</Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>
      ))}
    </Accordion.Root>
    </Flex>
    <Flex padding={{ base: "6", md: "24" }} alignContent="center" style={{"backgroundColor":"#435058d0"}} justifyContent="center" flexDirection="column" textAlign="center">
      <Text fontSize={{ base: "2xl", md: "4xl" }} fontWeight="bold" >
        Calculator Taxe
      </Text>
      <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="semibold" marginTop="4">
        Estimeaza ce taxe vei plati ca PFA in functie de venitul tau anual si cheltuielile deductibile
      </Text>
      <Box width={{ base: "100%", md: "58%" }} mx="auto" my="auto">
        <Card.Root
          bg="#00000066"
          color="white"
          borderRadius="16px"
          border="1px solid"
          borderColor="whiteAlpha.300"
        >
          <Card.Body p={{ base: "5", md: "7" }}>
            <VStack gap="5" align="stretch">
              <Field.Root>
                <Field.Label fontSize="lg" fontWeight="semibold">
                  Venit anual estimat (RON)
                </Field.Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  variant="subtle"
                  bgColor="#DCF763"
                  opacity="0.9"
                  borderRadius="10px"
                  fontSize="lg"
                  fontWeight="semibold"
                  placeholder="Introdu venitul anual estimat"
                  _placeholder={{ color: "blackAlpha.800" }}
                  color="black"
                  onChange={(e) =>
                    setAnualIncome(
                      Number.isNaN(e.currentTarget.valueAsNumber)
                        ? 0
                        : e.currentTarget.valueAsNumber,
                    )
                  }
                />
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="lg" fontWeight="semibold">
                  Cheltuieli deductibile (RON)
                </Field.Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  variant="subtle"
                  bgColor="#DCF763"
                  opacity="0.9"
                  borderRadius="10px"
                  fontSize="lg"
                  fontWeight="semibold"
                  placeholder="Introdu cheltuielile deductibile"
                  _placeholder={{ color: "blackAlpha.800" }}
                  color="black"
                  onChange={(e) =>
                    setDeductibleExpenses(
                      Number.isNaN(e.currentTarget.valueAsNumber)
                        ? 0
                        : e.currentTarget.valueAsNumber,
                    )
                  }
                />
              </Field.Root>

              <Button
                variant="surface"
                colorPalette="yellow"
                fontSize="15px"
                width="full"
                fontWeight="bold"
                borderRadius="8px"
                onClick={computeTaxes}
              >
                Calculeaza
              </Button>

              <Box borderTop="1px solid" borderColor="whiteAlpha.300" pt="5" textAlign="left">
                <Flex direction={{ base: "column", md: "row" }} gap="6" align="stretch">
                  <VStack flex="1" align="stretch" gap="2.5">
                    <Text fontSize="sm" color="whiteAlpha.800" textTransform="uppercase" letterSpacing="0.08em">
                      Sistem Real
                    </Text>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Venit brut</Text>
                      <Text fontSize="sm" fontWeight="semibold">{roundToInt(anualIncome)} RON</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Venit impozabil</Text>
                      <Text fontSize="sm" fontWeight="semibold">{roundToInt(anualIncome - deductibleExpenses)} RON</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Impozit pe venit (10%)</Text>
                      <Text fontSize="sm" fontWeight="semibold">-{realIncomeTax} RON</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Contributie CAS (25%)</Text>
                      <Text fontSize="sm" fontWeight="semibold">-{realCAS} RON</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Contributie CASS (10%)</Text>
                      <Text fontSize="sm" fontWeight="semibold">-{realCASS} RON</Text>
                    </HStack>

                    <HStack
                      justify="space-between"
                      borderTop="1px dashed"
                      borderColor="whiteAlpha.400"
                      pt="3"
                      mt="2"
                    >
                      <Text fontSize="lg" fontWeight="bold">Venit net PFA real</Text>
                      <Text fontSize="lg" fontWeight="bold" color="#DCF763">{netIncomeRealSystem} RON</Text>
                    </HStack>
                  </VStack>

                  <Box
                    width={{ base: "100%", md: "1px" }}
                    height={{ base: "1px", md: "auto" }}
                    bg="whiteAlpha.300"
                    alignSelf="stretch"
                  />

                  <VStack flex="1" align="stretch" gap="2.5">
                    <Text fontSize="sm" color="whiteAlpha.800" textTransform="uppercase" letterSpacing="0.08em">
                      Norma pe venit
                    </Text>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Norma anuala</Text>
                      <Text fontSize="sm" fontWeight="semibold">{UBER_BOLT_ANNUAL_INCOME_NORM} RON</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Impozit pe venit (10%)</Text>
                      <Text fontSize="sm" fontWeight="semibold">-{normIncomeTax} RON</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Contributie CAS (25%)</Text>
                      <Text fontSize="sm" fontWeight="semibold">-{normCAS} RON</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Contributie CASS (10%)</Text>
                      <Text fontSize="sm" fontWeight="semibold">-{normCASS} RON</Text>
                    </HStack>

                    <HStack
                      justify="space-between"
                      borderTop="1px dashed"
                      borderColor="whiteAlpha.400"
                      pt="3"
                      mt="2"
                    >
                      <Text fontSize="lg" fontWeight="bold">Venit net PFA norma</Text>
                      <Text fontSize="lg" fontWeight="bold" color="#DCF763">{netIncomeNormaSystem} RON</Text>
                    </HStack>
                  </VStack>
                </Flex>
              </Box>
            </VStack>
          </Card.Body>
        </Card.Root>
      </Box>

    </Flex>
    </>
  )
}

export default App
