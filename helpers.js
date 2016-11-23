function threeMFInfo (data) {
  let tag = data.tag
  let unit = tag.attributes['unit']
  let version = tag.attributes['version']
  return {unit, version}
}
