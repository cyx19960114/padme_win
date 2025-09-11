const getDomain = () : string  => {
  //TARGET_DOMAIN is being replaced/substituted during the docker build
  let domain : string = "${SERVICE_DOMAIN}";
  //If the domain has been replaced with an empty string or not replaced at all
  if (domain == "" || (domain.startsWith("${") && domain.endsWith("}")))
  {
    domain = "padme-analytics.de";
  }
  return domain;
}

const getProdDomain = () : string  => {
  //TARGET_DOMAIN is being replaced/substituted during the docker build
  let domain : string = "${PROD_SERVICE_DOMAIN}";
  //If the domain has been replaced with an empty string or not replaced at all
  if (domain == "" || (domain.startsWith("${") && domain.endsWith("}")))
  {
    domain = "padme-analytics.de";
  }
  return domain;
}

export const environment = {
  production: true,
  preventLeaveOnFileChanges: true,
  domain: getDomain(),
  prodDomain: getProdDomain(),
  apiUrl: `https://playgroundapi.${getDomain()}`, 
  defaultSessionId: "",
};