class MetadataStore {
  public entities: any[] = [];

  public insert(i: any) {
    this.entities.push(i);

    console.log(this.entities);
  }
}

export const METADATA_STORE = new MetadataStore();
