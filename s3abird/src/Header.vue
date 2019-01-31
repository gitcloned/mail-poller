<template>
<nav class="navbar navbar-expand-lg navbar-light bg-light">
  <router-link class="navbar-brand" to="/">Mails</router-link>
  <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSettings" aria-controls="navbarSettings" aria-expanded="false" aria-label="Toggle settings">
    <span class="navbar-toggler-icon"></span>
  </button>

  <div class="collapse navbar-collapse" id="navbarSettings">
    
  </div>
</nav>
</template>

<script>
module.exports = {
    name: 'Header',
    data: function () {
        return {
            config: this.$store.state.config || {}
        };
    }
};
</script>
